---
date: 2026年06月10日
---

# PyTorch torchtext

虽然 PyTorch 生态中有 `torchvision` 处理图像数据、`torchaudio` 处理音频数据，但在文本处理领域，官方曾提供的 `torchtext` 库经历了一些变化。本节介绍如何使用各种方法进行文本数据的预处理、构建词表、数据加载等操作。

> 注意：torchtext 库经历了一些重构。推荐使用 **torchtext.legacy** 或自行构建文本处理管线。最新的 torchtext 版本已经回归并提供了更现代的 API。

------

## 1. 文本数据预处理基础

文本预处理是 NLP 任务的第一步，包括分词、建立词表、编码等操作。

### 1.1 基本文本处理流程

```py
import re
from collections import Counter

class SimpleTokenizer:
    """
    简单分词器：按空格和标点分词
    """
    def __init__(self):
        # 标点符号映射
        self.punctuation = str.maketrans('', '', '.,!?;:"\'-()[]{}')

    def tokenize(self, text):
        # 转小写
        text = text.lower()
        # 移除标点
        text = text.translate(self.punctuation)
        # 分词
        tokens = text.split()
        return tokens


class Vocabulary:
    """
    词表构建
    """
    def __init__(self, min_freq=2, max_size=10000):
        self.min_freq = min_freq
        self.max_size = max_size
        self.word2idx = {'<PAD>': 0, '<UNK>': 1}
        self.idx2word = {0: '<PAD>', 1: '<UNK>'}
        self.word_count = Counter()

    def build_vocab(self, texts):
        """从文本列表构建词表"""
        tokenizer = SimpleTokenizer()

        # 统计词频
        for text in texts:
            tokens = tokenizer.tokenize(text)
            self.word_count.update(tokens)

        # 构建词表
        for word, count in self.word_count.most_common(self.max_size):
            if count < self.min_freq:
                break
            if word not in self.word2idx:
                idx = len(self.word2idx)
                self.word2idx[word] = idx
                self.idx2word[idx] = word

        print(f"词表大小: {len(self.word2idx)}")

    def encode(self, text, max_len=50):
        """编码文本为索引序列"""
        tokenizer = SimpleTokenizer()
        tokens = tokenizer.tokenize(text)[:max_len]

        # 编码
        indices = [
            self.word2idx.get(token, self.word2idx['<UNK>'])
            for token in tokens
        ]

        # 补零
        if len(indices) < max_len:
            indices += [self.word2idx['<PAD>']] * (max_len - len(indices))

        return indices

    def decode(self, indices):
        """解码索引序列为文本"""
        tokens = [self.idx2word.get(idx, '<UNK>') for idx in indices]
        return ' '.join(tokens)


# 使用示例
texts = [
    "Hello world",
    "This is a test",
    "PyTorch is great for deep learning",
    "Natural language processing is fun",
    "Deep learning enables many applications",
]

vocab = Vocabulary(min_freq=1, max_size=100)
vocab.build_vocab(texts)

# 编码
encoded = vocab.encode("Hello deep learning world!", max_len=10)
print(f"编码结果: {encoded}")

# 解码
decoded = vocab.decode(encoded)
print(f"解码结果: {decoded}")
```

## 2. 使用 torchtext (Legacy)

如果已安装 torchtext，可以使用 legacy 模块进行文本处理。

### 2.1 安装与导入

```py
# 安装 torchtext
# pip install torchtext

# 导入 legacy 模块
try:
    import torchtext
    from torchtext.legacy import data
    from torchtext.legacy import datasets
    print(f"torchtext 版本: {torchtext.__version__}")
    TORCHTEXT_AVAILABLE = True
except ImportError:
    print("torchtext 未安装，使用自定义实现")
    TORCHTEXT_AVAILABLE = False

# 或者尝试新版
try:
    from torchtext import transforms
    from torchtext.datasets import AG_NEWS
    print("新版 torchtext 可用")
except ImportError:
    print("新版 torchtext 不可用")
```

### 2.2 Field 和 Dataset

```py
# 使用 torchtext.legacy
from torchtext.legacy import data
from torchtext.legacy import datasets
from torchtext.legacy.data import Field, TabularDataset, BucketIterator

# 定义字段
TEXT = Field(
    tokenize='spacy',           # 使用 spacy 分词
    tokenizer_language='en_core_web_sm',
    lower=True,                 # 转小写
    include_lengths=True,       # 返回序列长度
    batch_first=True            # batch 维度在前
)

LABEL = Field(
    sequential=False,
    use_vocab=False,
    dtype=torch.long
)

# 定义数据集
# 假设有 CSV 文件格式: label,text
# 1,This is a positive review
# 0,This is a negative review

# 或使用内置数据集（如 IMDB）
# train_data, test_data = datasets.IMDB.splits(TEXT, LABEL)

print("Field 和 Dataset 配置完成")
```

### 2.3 词表构建与迭代器

```py
# 构建词表
# TEXT.build_vocab(train_data, vectors="glove.6B.100d", max_size=10000)

# 创建迭代器
# train_iterator, test_iterator = BucketIterator.splits(
#     (train_data, test_data),
#     batch_size=32,
#     sort_within_batch=True,
#     device=torch.device('cuda')
# )

# 迭代训练
# for batch in train_iterator:
#     text, lengths = batch.text
#     labels = batch.label
#     # 训练代码

print("词表和迭代器配置完成")
```

### 3. 自定义 NLP 数据管线

推荐使用更灵活的自定义数据处理方式，不依赖 torchtext。

### 3.1 数据集类实现

```py
import torch
from torch.utils.data import Dataset, DataLoader
from collections import Counter
import re

class TextDataset(Dataset):
    """
    文本数据集
    """
    def __init__(self, texts, labels, vocab=None, max_len=128, min_freq=2):
        self.texts = texts
        self.labels = labels
        self.max_len = max_len

        # 构建或使用已有词表
        if vocab is None:
            self.vocab = self._build_vocab(texts, min_freq)
        else:
            self.vocab = vocab

    def _build_vocab(self, texts, min_freq):
        """构建词表"""
        word_counts = Counter()

        for text in texts:
            tokens = self._tokenize(text)
            word_counts.update(tokens)

        # 创建词表
        word2idx = {'<PAD>': 0, '<UNK>': 1}
        for word, count in word_counts.items():
            if count >= min_freq:
                word2idx[word] = len(word2idx)

        return word2idx

    def _tokenize(self, text):
        """简单分词"""
        # 转小写
        text = text.lower()
        # 移除特殊字符，保留字母数字和空格
        text = re.sub(r'[^a-z0-9\s]', ' ', text)
        # 分词
        tokens = text.split()
        return tokens

    def _encode(self, text):
        """编码文本"""
        tokens = self._tokenize(text)[:self.max_len]
        indices = [
            self.vocab.get(token, self.vocab['<UNK>'])
            for token in tokens
        ]

        # 补零
        if len(indices) < self.max_len:
            indices += [self.vocab['<PAD>']] * (self.max_len - len(indices))

        return indices

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = self.texts[idx]
        label = self.labels[idx]

        encoded = self._encode(text)
        return torch.tensor(encoded, dtype=torch.long), torch.tensor(label, dtype=torch.long)


# 使用示例
texts = [
    "This is a great movie",
    "I hated this film",
    "Amazing performance",
    "Terrible acting",
    "Highly recommend",
]

labels = [1, 0, 1, 0, 1]

dataset = TextDataset(texts, labels, max_len=10)
print(f"数据集大小: {len(dataset)}")
print(f"词表大小: {len(dataset.vocab)}")

# 获取样本
text, label = dataset[0]
print(f"文本编码: {text[:5]}...")
print(f"标签: {label}")
```

### 3.2 高级分词器

```py
# 使用 spacy 进行高级分词
def tokenize_with_spacy(text):
    """使用 spacy 分词"""
    try:
        import spacy
        nlp = spacy.load("en_core_web_sm")
        doc = nlp(text)
        return [token.text for token in doc]
    except ImportError:
        print("spacy 未安装，使用简单分词")
        return text.lower().split()


# 使用 nltk 进行分词和词干提取
def tokenize_with_nltk(text):
    """使用 nltk 分词"""
    try:
        import nltk
        from nltk.tokenize import word_tokenize
        from nltk.stem import PorterStemmer

        # 分词
        tokens = word_tokenize(text.lower())

        # 可选：词干提取
        stemmer = PorterStemmer()
        tokens = [stemmer.stem(token) for token in tokens if token.isalnum()]

        return tokens
    except ImportError:
        return text.lower().split()


# 使用 SentencePiece 进行子词分词
class SentencePieceTokenizer:
    """
    使用 SentencePiece 进行子词分词
    """
    def __init__(self, model_path=None):
        self.model_path = model_path
        self.sp = None

    def train(self, texts, vocab_size=10000):
        """训练 SentencePiece 模型"""
        try:
            import sentencepiece as spm
            import tempfile

            # 写入临时文件
            with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as f:
                for text in texts:
                    f.write(text + '\n')
                temp_file = f.name

            # 训练
            spm.SentencePieceTrainer.train(
                input=temp_file,
                model_prefix='spm_model',
                vocab_size=vocab_size,
                character_coverage=1.0,
                model_type='unigram',
            )

            self.sp = spm.SentencePieceProcessor()
            self.sp.load('spm_model.model')

        except ImportError:
            print("sentencepiece 未安装")

    def encode(self, text):
        if self.sp:
            return self.sp.encode(text, out_type=str)
        return text.split()

    def decode(self, ids):
        if self.sp:
            return self.sp.decode(ids)
        return ' '.join(ids)
```

### 3.3 完整数据加载器

```py
import torch
from torch.utils.data import Dataset, DataLoader
from collections import Counter

class NLPDataset(Dataset):
    """
    完整的 NLP 数据集类
    支持变长序列、词表构建、批量填充
    """
    def __init__(self, texts, labels, min_freq=2, max_vocab=30000):
        self.texts = texts
        self.labels = labels
        self.min_freq = min_freq

        # 构建词表
        self.word2idx, self.idx2word = self._build_vocab(texts, max_vocab)
        self.pad_idx = self.word2idx['<PAD>']
        self.unk_idx = self.word2idx['<UNK>']

    def _tokenize(self, text):
        text = text.lower()
        text = re.sub(r'[^a-z0-9\s]', ' ', text)
        return text.split()

    def _build_vocab(self, texts, max_vocab):
        """构建词表"""
        counter = Counter()
        for text in texts:
            tokens = self._tokenize(text)
            counter.update(tokens)

        # 构建词表
        word2idx = {'<PAD>': 0, '<UNK>': 1}
        idx2word = {0: '<PAD>', 1: '<UNK>'}

        for word, count in counter.most_common(max_vocab):
            if count >= self.min_freq and word not in word2idx:
                idx = len(word2idx)
                word2idx[word] = idx
                idx2word[idx] = word

        return word2idx, idx2word

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = self.texts[idx]
        tokens = self._tokenize(text)
        indices = [self.word2idx.get(t, self.unk_idx) for t in tokens]

        return {
            'input': indices,
            'label': self.labels[idx],
            'length': len(indices)
        }


def collate_fn(batch, pad_idx=0):
    """
    自定义 collate 函数：处理变长序列
    """
    # 按长度降序排序
    batch.sort(key=lambda x: x['length'], reverse=True)

    texts = [item['input'] for item in batch]
    labels = [item['label'] for item in batch]
    lengths = [item['length'] for item in batch]

    # 填充到相同长度
    max_len = max(lengths)
    padded = [text + [pad_idx] * (max_len - len(text)) for text in texts]

    return {
        'input': torch.tensor(padded, dtype=torch.long),
        'labels': torch.tensor(labels, dtype=torch.long),
        'lengths': torch.tensor(lengths, dtype=torch.long)
    }


# 使用 DataLoader
def create_dataloader(texts, labels, batch_size=32, shuffle=True):
    """创建数据加载器"""
    dataset = NLPDataset(texts, labels)
    pad_idx = dataset.pad_idx

    dataloader = DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=shuffle,
        collate_fn=lambda b: collate_fn(b, pad_idx)
    )

    return dataloader, dataset


# 模拟数据
texts = [
    "I love this movie",
    "This is a bad movie",
    "Great film",
    "Terrible acting",
    "I recommend this",
    "Not worth watching",
]

labels = [1, 0, 1, 0, 1, 0]

dataloader, dataset = create_dataloader(texts, labels, batch_size=2)

for batch in dataloader:
    print("Input shape:", batch['input'].shape)
    print("Labels:", batch['labels'])
    print("Lengths:", batch['lengths'])
    print("---")
```

## 4. 预训练词向量加载

使用预训练词向量可以提升模型效果。

### 4.1 GloVe 词向量

```py
import torch
import numpy as np

def load_glove_vectors(filepath, word2idx, embedding_dim=300):
    """
    加载 GloVe 预训练词向量

    参数:
        filepath: GloVe 文件路径
        word2idx: 词表字典
        embedding_dim: 词向量维度
    """
    print("加载 GloVe 词向量...")

    # 初始化嵌入矩阵
    num_words = len(word2idx)
    embeddings = np.random.randn(num_words, embedding_dim).astype(np.float32)
    embeddings[word2idx['<PAD>']] = np.zeros(embedding_dim)  # PAD 向量置零

    words_loaded = 0

    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            values = line.strip().split()
            word = values[0]

            if word in word2idx:
                idx = word2idx[word]
                vector = np.asarray(values[1:], dtype=np.float32)
                if len(vector) == embedding_dim:
                    embeddings[idx] = vector
                    words_loaded += 1

    print(f"已加载 {words_loaded}/{num_words} 个词向量")

    return torch.from_numpy(embeddings)


# 模拟加载
def create_pretrained_embedding(word2idx, embedding_dim=300, pretrained_path=None):
    """
    创建预训练嵌入层
    """
    if pretrained_path and False:  # 设置为 True 并提供有效路径
        weights = load_glove_vectors(pretrained_path, word2idx, embedding_dim)
    else:
        # 使用随机初始化
        num_words = len(word2idx)
        weights = torch.randn(num_words, embedding_dim) * 0.1

    embedding = torch.nn.Embedding.from_pretrained(weights, padding_idx=0)
    return embedding


# 示例
word2idx = {'<PAD>': 0, '<UNK>': 1, 'hello': 2, 'world': 3, 'test': 4}
embedding = create_pretrained_embedding(word2idx, embedding_dim=100)

print(f"嵌入层形状: {embedding.weight.shape}")
```

### 4.2 使用 gensim 加载 Word2Vec

```py
def load_word2vec(word2idx, model_path=None):
    """
    使用 gensim 加载 Word2Vec
    """
    try:
        from gensim.models import KeyedVectors

        # 加载模型
        # model = KeyedVectors.load_word2vec_format(model_path, binary=True)

        # 创建嵌入矩阵
        embedding_dim = 300
        num_words = len(word2idx)
        embeddings = np.random.randn(num_words, embedding_dim).astype(np.float32)

        # 填充词向量
        embeddings[word2idx['<PAD>']] = np.zeros(embedding_dim)

        # 加载词向量
        # for word, idx in word2idx.items():
        #     if word in model:
        #         embeddings[idx] = model[word]

        return torch.from_numpy(embeddings)

    except ImportError:
        print("gensim 未安装")
        return None
```

### 4.3 自定义预训练嵌入

```py
import torch
import torch.nn as nn

class PretrainedEmbedding(nn.Module):
    """
    支持加载预训练词向量的嵌入层
    """
    def __init__(self, vocab_size, embed_dim, pretrained_weights=None,
                 padding_idx=0, freeze=False):
        super().__init__()

        self.embedding = nn.Embedding(
            vocab_size,
            embed_dim,
            padding_idx=padding_idx
        )

        # 加载预训练权重
        if pretrained_weights is not None:
            self.embedding.weight.data.copy_(pretrained_weights)

        # 是否冻结
        if freeze:
            self.embedding.weight.requires_grad = False

    def forward(self, x):
        return self.embedding(x)


# 使用示例
vocab_size = 10000
embed_dim = 300
pretrained = torch.randn(vocab_size, embed_dim) * 0.1

embedding_layer = PretrainedEmbedding(
    vocab_size,
    embed_dim,
    pretrained_weights=pretrained,
    padding_idx=0,
    freeze=False  # 设置为 True 冻结嵌入层
)

# 测试
x = torch.tensor([[1, 2, 3], [4, 5, 6]])
output = embedding_layer(x)
print(f"输入形状: {x.shape}")
print(f"输出形状: {output.shape}")
```

## 5. 文本数据增强

数据增强可以提升模型泛化能力。

### 5.1 回译增强

```py
# 回译增强需要翻译 API，以下是概念示例

def back_translation_augment(text, translator):
    """
    回译增强：将文本翻译成另一种语言再翻译回来
    """
    # 翻译成目标语言
    translated = translator.translate(text, dest='fr')
    # 翻译回源语言
    back_translated = translator.translate(translated.text, dest='en')
    return back_translated.text

# 使用示例
# from googletrans import Translator
# translator = Translator()
# augmented_text = back_translation_augment("I love this movie", translator)
```

### 5.2 同义词替换

```py
import random

def synonym_replacement(text, n=1, stop_words=None):
    """
    同义词替换
    """
    if stop_words is None:
        stop_words = {'a', 'an', 'the', 'is', 'are', 'was', 'were'}

    words = text.lower().split()
    replaceable = [i for i, w in enumerate(words) if w not in stop_words]

    if not replaceable:
        return text

    n = min(n, len(replaceable))
    replace_idx = random.sample(replaceable, n)

    # 简化的同义词映射（实际应使用 WordNet）
    synonym_map = {
        'good': ['great', 'excellent', 'nice'],
        'bad': ['poor', 'terrible', 'awful'],
        'movie': ['film', 'cinema'],
        'loved': ['adored', 'enjoyed'],
    }

    for idx in replace_idx:
        word = words[idx]
        if word in synonym_map:
            words[idx] = random.choice(synonym_map[word])

    return ' '.join(words)


# 使用示例
text = "I loved this good movie"
augmented = synonym_replacement(text, n=2)
print(f"原句: {text}")
print(f"增强: {augmented}")
```

### 5.3 随机插入与删除

```py
import random

def random_insertion(text, n=1):
    """
    随机插入：在文本中随机插入词
    """
    words = text.lower().split()
    for _ in range(n):
        if len(words) > 1:
            idx = random.randint(0, len(words) - 1)
            # 简化的插入词
            insert_words = ['really', 'very', 'quite', 'actually']
            words.insert(idx, random.choice(insert_words))
    return ' '.join(words)


def random_deletion(text, p=0.1):
    """
    随机删除：以概率 p 删除词
    """
    words = text.lower().split()
    if len(words) == 1:
        return text

    remaining = [w for w in words if random.random() > p]
    if len(remaining) == 0:
        return random.choice(words)

    return ' '.join(remaining)


def random_swap(text, n=1):
    """
    随机交换：随机交换两个词的位置
    """
    words = text.lower().split()
    if len(words) < 2:
        return text

    for _ in range(n):
        idx1, idx2 = random.sample(range(len(words)), 2)
        words[idx1], words[idx2] = words[idx2], words[idx1]

    return ' '.join(words)


# 使用示例
text = "This is a great movie about love and happiness"

print("原始:", text)
print("插入:", random_insertion(text, n=2))
print("删除:", random_deletion(text, p=0.2))
print("交换:", random_swap(text, n=2))
```

## 6. 常见 NLP 任务示例

### 6.1 文本分类完整流程

```py
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

# 1. 数据准备
texts = [
    "I love this product, it is amazing!",
    "Terrible quality, waste of money.",
    "Great value for the price.",
    "Not satisfied with the purchase.",
    "Best purchase I have ever made!",
    "Very disappointed with this item.",
]

labels = [1, 0, 1, 0, 1, 0]  # 1: 正面, 0: 负面

# 2. 数据集
class TextClassificationDataset(Dataset):
    def __init__(self, texts, labels, max_len=50):
        self.texts = texts
        self.labels = labels
        self.max_len = max_len
        self.vocab = self._build_vocab(texts)

    def _build_vocab(self, texts):
        vocab = {'<PAD>': 0, '<UNK>': 1}
        for text in texts:
            for word in text.lower().split():
                if word not in vocab:
                    vocab[word] = len(vocab)
        return vocab

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = self.texts[idx]
        label = self.labels[idx]

        # 简单编码
        tokens = text.lower().split()[:self.max_len]
        indices = [self.vocab.get(t, 1) for t in tokens]

        # 填充
        if len(indices) < self.max_len:
            indices += [0] * (self.max_len - len(indices))

        return torch.tensor(indices, dtype=torch.long), torch.tensor(label, dtype=torch.long)

# 3. 模型
class TextClassifier(nn.Module):
    def __init__(self, vocab_size, embed_dim=128, hidden_dim=64, num_classes=2):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, num_classes)

    def forward(self, x):
        embedded = self.embedding(x)
        _, (hidden, _) = self.lstm(embedded)
        output = self.fc(hidden.squeeze(0))
        return output

# 4. 训练
dataset = TextClassificationDataset(texts, labels)
dataloader = DataLoader(dataset, batch_size=2, shuffle=True)

model = TextClassifier(vocab_size=len(dataset.vocab))
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

# 训练几个 epoch
model.train()
for epoch in range(10):
    total_loss = 0
    for texts_batch, labels_batch in dataloader:
        optimizer.zero_grad()
        outputs = model(texts_batch)
        loss = criterion(outputs, labels_batch)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()

    print(f"Epoch {epoch+1}, Loss: {total_loss/len(dataloader):.4f}")

print("训练完成！")
```

### 6.2 序列标注（NER）示例

```py
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

# 序列标注数据集
class NERDataset(Dataset):
    """
    命名实体识别数据集
    格式: [(word, tag), ...]
    """
    def __init__(self, sentences_tags, word2idx, tag2idx, max_len=50):
        self.sentences_tags = sentences_tags
        self.word2idx = word2idx
        self.tag2idx = tag2idx
        self.max_len = max_len

    def __len__(self):
        return len(self.sentences_tags)

    def __getitem__(self, idx):
        sentence_tags = self.sentences_tags[idx]
        words = [wt[0] for wt in sentence_tags]
        tags = [wt[1] for wt in sentence_tags]

        # 编码
        word_ids = [self.word2idx.get(w.lower(), 1) for w in words[:self.max_len]]
        tag_ids = [self.tag2idx[t] for t in tags[:self.max_len]]

        # 填充
        if len(word_ids) < self.max_len:
            word_ids += [0] * (self.max_len - len(word_ids))
            tag_ids += [0] * (self.max_len - len(tag_ids))

        return {
            'words': torch.tensor(word_ids, dtype=torch.long),
            'tags': torch.tensor(tag_ids, dtype=torch.long)
        }

# NER 模型
class NERModel(nn.Module):
    def __init__(self, vocab_size, tag_size, embed_dim=128, hidden_dim=256):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True, bidirectional=True)
        self.fc = nn.Linear(hidden_dim * 2, tag_size)

    def forward(self, x):
        embedded = self.embedding(x)
        lstm_out, _ = self.lstm(embedded)
        logits = self.fc(lstm_out)
        return logits


# 示例数据
data = [
    [("John", "B-PER"), ("lives", "O"), ("in", "O"), ("New", "B-LOC"), ("York", "I-LOC"), (".", "O")],
    [("Apple", "B-ORG"), ("is", "O"), ("a", "O"), ("company", "O"), (".", "O")],
]

# 构建词表和标签表
word2idx = {'<PAD>': 0, '<UNK>': 1}
tag2idx = {'O': 0, 'B-PER': 1, 'I-PER': 2, 'B-LOC': 3, 'I-LOC': 4, 'B-ORG': 5, 'I-ORG': 6}

for sent in data:
    for word, tag in sent:
        if word.lower() not in word2idx:
            word2idx[word.lower()] = len(word2idx)

print(f"词表大小: {len(word2idx)}")
print(f"标签数: {len(tag2idx)}")
```

## 7. 替代方案推荐

### 7.1 其他文本处理库

| 库名                 | 特点           | 适用场景            |
| :------------------- | :------------- | :------------------ |
| HuggingFace Datasets | 数据加载和处理 | 通用 NLP 任务       |
| spacy                | 高级 NLP 工具  | 分词、NER、依存分析 |
| NLTK                 | 经典 NLP 工具  | 教学、原型开发      |
| textblob             | 简单易用       | 快速文本处理        |

### 7.2 HuggingFace Datasets 使用

```py
# 使用 HuggingFace Datasets 库
# pip install datasets

from datasets import load_dataset

# 加载数据集
# dataset = load_dataset("imdb")
# dataset = load_dataset("squad")

# 数据预处理
# def preprocess_function(examples):
#     return tokenizer(examples['text'], truncation=True, padding='max_length')

# tokenized_dataset = dataset.map(preprocess_function, batched=True)

print("HuggingFace Datasets 使用示例:")
print("from datasets import load_dataset")
print("dataset = load_dataset('imdb')")
```

## 8. API 快速参考

### 8.1 文本处理常用操作

| 操作       | 方法                               |
| :--------- | :--------------------------------- |
| 分词       | text.split(), spacy, nltk, jieba   |
| 词表构建   | Counter, vocab.build_vocab()       |
| 编码       | vocab.encode(), tokenizer.encode() |
| 解码       | vocab.decode(), tokenizer.decode() |
| 填充       | pad_sequence, collate_fn           |
| 加载词向量 | Gensim, GloVe 直接加载             |

### 8.2 数据增强方法

| 方法       | 描述               |
| :--------- | :----------------- |
| 同义词替换 | 随机替换词为同义词 |
| 随机插入   | 随机插入词         |
| 随机删除   | 随机删除词         |
| 随机交换   | 随机交换词位置     |
| 回译       | 翻译后再翻译回来   |

### 8.3 推荐的数据处理流程

```
1. 数据清洗
   - 去除 HTML 标签、特殊字符
   - 统一编码、大小写

2. 分词
   - 英文: spaCy / NLTK
   - 中文: jieba / pkuseg

3. 词表构建
   - 过滤低频词
   - 设定最大词表大小

4. 序列化
   - 编码为索引
   - 统一长度（填充/截断）

5. 数据增强（可选）
   - 同义词替换、回译

6. 批量加载
   - DataLoader + 自定义 collate_fn
```
