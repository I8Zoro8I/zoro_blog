---
date: 2026年08月14日
---

# Python 调用 Dify 平台工作流

本章偏**平台调用实战**：学会用 API 和 Python 调用你在 Dify 上已搭建好的工作流，把“页面里的工作流”真正变成“代码里可调用的服务”。

------

**本章课程目标：**

- 知道调用前需在 Dify 中**发布工作流**，并会**创建 API 密钥**（密钥与工作流一一对应）。
- 掌握 Dify 工作流调用最核心的 5 个要素：URL、Authorization、`inputs`、`response_mode`、`user`。
- 能用 **Postman** 或 **Python + requests** 成功触发一个 Dify 工作流，并从流式结果里拿到最终输出。
- 会在 Dify 工作空间里查看运行日志，把“代码侧日志”和“平台侧日志”对起来排查问题。

**学习建议：** 这篇是在把 Dify 工作流从页面带到代码里。读的时候盯住五个位置：发布状态、API Key、`inputs`、流式事件、运行日志。建议先用 Postman 或 `requests` 跑通一个最小调用，再回头补字段细节；否则很容易把“接口没通”和“工作流本身没跑对”混在一起。如果你已经看过 平台案例，本章会是非常自然的下一步。

------

## 1、调用前必须完成的三件事

### 1.1 先发布工作流

要通过 API 的方式启动工作流，**工作流必须处于已发布状态**。

![Dify 工作流发布入口与发布状态的界面示意图](https://didilili.github.io/ai-agents-from-zero/images/4/4-1-1-1.png)

这一步很好理解：未发布的工作流仍处于编辑态，节点、变量、提示词都可能随时变化，不适合作为外部代码依赖的服务接口。

### 1.2 查看 API 文档

Dify 会为工作流提供对应的 API 文档入口。

![Dify 工作流 API 文档入口的界面示意图](https://didilili.github.io/ai-agents-from-zero/images/4/4-1-2-1.png)

第一次学习时，建议你不要跳过这一步。因为后面 Python 代码里用到的 URL、请求头、请求体结构，平台都已经给你说明了。

### 1.3 创建 API 密钥

#### 1.3.1 创建密钥

![在 Dify 中创建工作流 API 密钥的界面](https://didilili.github.io/ai-agents-from-zero/images/4/4-1-3-1.png)

![在 Dify 中查看并复制 API 密钥的界面](https://didilili.github.io/ai-agents-from-zero/images/4/4-1-3-2.png)

创建后复制即可。

#### 1.3.2 工作流和 API Key 的关系

Dify 的 API 密钥是**和工作流绑定**的。一个 API Key 只能用于**访问特定的工作流**，而一个工作流可以对应多个 API Key。

![Dify 工作流与 API Key 绑定关系的界面示意图](https://didilili.github.io/ai-agents-from-zero/images/4/4-1-3-3.png)

这和真实项目的权限控制很像：同一个工作流可以给不同环境、不同服务、不同调用方分发不同密钥，但密钥本身并不是“整个工作空间通用”的万能钥匙。

------

## 2、先看懂请求结构

通过 POST 请求启动工作流，官方常见写法如下：

```sh
curl -X POST 'https://api.dify.ai/v1/workflows/run' \
--header 'Authorization: Bearer {api_key}' \
--header 'Content-Type: application/json' \
--data-raw '{
  "inputs": {},
  "response_mode": "streaming",
  "user": "abc-123"
}'
```

### 2.1 URL

```text
https://api.dify.ai/v1/workflows/run
```

如果你使用的是本地部署版 Dify，通常改成：

```text
http://localhost/v1/workflows/run
```

如果是服务器部署，则替换成你自己的域名或服务器地址。

### 2.2 请求头

| 键            | 值                 |
| ------------- | ------------------ |
| Authorization | `Bearer {api_key}` |
| Content-Type  | `application/json` |

其中 `api_key` 替换为上一步创建的密钥。

### 2.3 请求体

```json
{
  "inputs": {},
  "response_mode": "streaming",
  "user": "abc-123"
}
```

这三个字段分别解决不同问题：

- `inputs`：传给工作流的业务入参，字段名必须和工作流中定义的输入变量对齐。
- `response_mode`：决定返回方式，是流式还是阻塞式。
- `user`：标识调用方，便于平台日志区分不同用户或请求来源。

### 2.4 streaming 和 blocking 的区别

- **流式（streaming）**：基于 SSE（Server-Sent Events）边执行边返回，适合长时间任务、需要看到过程日志的场景。
- **阻塞式（blocking）**：等待工作流全部执行完再一次性返回，写法更简单，但长流程更容易超时。

> **可这样记：** 调试和真实项目里，一般优先用 `streaming`。因为它既能让你拿到最终结果，也能帮助你看到中间节点发生了什么。

------

## 3、先用 Postman 验证一次

这一节不是必须的，但非常推荐。因为很多问题在 Python 接入之前，先用 Postman 就能定位清楚。

### 3.1 新建 POST 请求并填写 URL

![在 Postman 中新建 Dify 工作流 POST 请求的界面](https://didilili.github.io/ai-agents-from-zero/images/4/4-3-1-1.png)

### 3.2 添加请求头

![在 Postman 中配置 Dify 工作流请求头的界面](https://didilili.github.io/ai-agents-from-zero/images/4/4-3-2-1.png)

### 3.3 添加请求体

Body 选择 `raw`，格式选择 `JSON`。

![在 Postman 中填写 Dify 工作流 JSON 请求体的界面](https://didilili.github.io/ai-agents-from-zero/images/4/4-3-3-1.png)

示例请求体：

```json
{
  "inputs": {
    "target": "新能源汽车发展概况"
  },
  "response_mode": "streaming",
  "user": "postman_test"
}
```

这里的 `target` 就是工作流输入变量名，必须和你在 Dify 工作流中定义的字段一致。

### 3.4 发送请求

![在 Postman 中发送 Dify 工作流请求的界面](https://didilili.github.io/ai-agents-from-zero/images/4/4-3-4-1.png)

### 3.5 看懂响应

![Postman 中查看 Dify 流式响应整体结果的界面](https://didilili.github.io/ai-agents-from-zero/images/4/4-3-5-1.png)

响应开始标志：

![Dify 流式响应开始事件的界面示意图](https://didilili.github.io/ai-agents-from-zero/images/4/4-3-5-2.png)

响应结束标志：

![Dify 流式响应结束事件的界面示意图](https://didilili.github.io/ai-agents-from-zero/images/4/4-3-5-3.png)

最终响应体携带工作流的最终输出：

![Dify 工作流最终输出结果在响应体中的界面示意图](https://didilili.github.io/ai-agents-from-zero/images/4/4-3-5-4.png)

### 3.6 怎么理解返回体

最后一个关键事件通常是：

```json
{
  "event": "workflow_finished",
  "workflow_run_id": "xxx",
  "task_id": "xxx",
  "data": {
    "status": "succeeded",
    "outputs": {
      "output": ["...最终结果..."]
    }
  }
}
```

第一次学习时，把它记成一句话就够了：

> **只要你最终收到了 `workflow_finished`，并且 `status` 是 `succeeded`，这次工作流调用通常就算成功了。**

------

## 4、在 Dify 后台看运行日志

### 4.1 打开日志页面

![Dify 工作流运行日志入口的界面示意图](https://didilili.github.io/ai-agents-from-zero/images/4/4-4-1-1.png)

### 4.2 查看结果

![Dify 工作流运行结果列表页的界面示意图](https://didilili.github.io/ai-agents-from-zero/images/4/4-4-2-1.png)

### 4.3 查看详情

![Dify 工作流运行详情页的界面示意图](https://didilili.github.io/ai-agents-from-zero/images/4/4-4-3-1.png)

### 4.4 查看追踪信息

![Dify 工作流追踪信息页面的界面示意图](https://didilili.github.io/ai-agents-from-zero/images/4/4-4-4-1.png)

平台日志的价值非常大，因为它能告诉你：这次请求有没有真正进到工作流；哪个节点报错了；输入变量有没有传对；最终输出是不是和代码侧拿到的一致。

很多时候，问题并不是 Python 代码写错，而是**工作流内部节点、变量名、工具配置**出了问题。这个时候平台日志会比本地日志更直观。

------

## 5、用 Python 调用 Dify 工作流

### 5.1 安装依赖

```sh
pip install requests
```

### 5.2 一份更适合真实项目的示例代码

```python
import requests
import json

# 响应返回模式
# 流式，基于 SSE（Server-Sent Events）实现类似打字机输出方式的流式返回
STREAMING_MODE="streaming"
# 阻塞式，等待执行完毕后返回结果（流程较长则可能会被中断）。由于 Dify 云/网关限制，请求在约 100 秒无返回后会超时中断
BLOCKING_MODE="blocking"

# 工作流的API_KEY
API_KEY="{your key}"
# Dify base_url，如果是本地部署，替换为 http://localhost/v1
BASE_URL="https://api.dify.ai/v1"

# 工作流完成标志
WORKFLOW_FINISHED="workflow_finished"
# 工作流成功标志
WORKFLOW_SUCCESS="succeeded"

# 用于启动工作流
def stream_dify_workflow(target, api_key=API_KEY, base_url=BASE_URL, username="python_request", mode=STREAMING_MODE):
    # 拼接用于启动工作流的 url
    url = f"{base_url}/workflows/run"

    # 拼接头信息，包括API Key和数据类型
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # 拼接请求体
    payload = {
        "inputs": {"target": target},
        "response_mode": mode,
        "user": username
    }

    try:
        # 使用stream=True保持连接打开
        with requests.post(url, headers=headers, json=payload, stream=True) as response:
            if response.status_code != 200:
                print(f"请求失败，状态码: {response.status_code}")
                print(response.text)
                return

            print("=== 开始接收流式响应: ===")
            # 逐行读取服务器推送的数据
            for line in response.iter_lines():
                if line:
                    # 解码
                    decoded_line = line.decode('utf-8')

                    # 将 JSON 中的 Unicode 转义序列（如 \uXXXX）解码为对应字符
                    fixed_line = decoded_line.encode("utf-8").decode("unicode_escape")

                    # 打印由二进制解析为 UTF-8 后的响应
                    print(f"decoded_line: {decoded_line}")
                    # 解码后换行会导致日志非常乱，一般不打开
                    # print(f"fixed_line: {fixed_line}")
                    # print(fixed_line)

                    # 去除SSE格式前缀
                    if(decoded_line.startswith("data: ")):
                        decoded_line=decoded_line[6:]

                        try:
                            # 尝试解析为JSON
                            json_data = json.loads(decoded_line)
                            if(json_data.get("event")==WORKFLOW_FINISHED):
                                print("---> 工作流执行完毕 <---")
                                print(f"{json_data.get("data")=}")
                                data = json_data.get("data")
                                workflow_status = data.get("status")
                                if (workflow_status == WORKFLOW_SUCCESS):
                                    print("---> 工作流执行成功 <---")

                                    try:
                                        # 获取工作流最终输出
                                        result = data.get("outputs").get("output")

                                        # 返回结果
                                        return result
                                    except Exception as e:
                                        print("工作流输出解码错误: ", e)
                                        print("data: ", data)
                                        return None
                                else:
                                    print("---> 工作流执行失败 <---")
                                    return None
                        except Exception as e:
                            print("JSON解析错误: ", e)
                            return None

            print("=== 流式响应结束 ===")

    except requests.exceptions.RequestException as e:
        print(f"请求发生错误: {e}")
        return None


if __name__ == "__main__":
    result = stream_dify_workflow("新能源发展现状")
    print("----------> result <----------")

    # 若成功返回，遍历结果列表并打印最终输出（失败时 result 为 None）
    if result:
        for item in result:
            print(item)
```

例子2:

![Dify 旅游小助手](/images/Agent/Dify/01.png)

```python
# 对话Agent
#api 为 chat-messages
import requests
import json
import re

# 响应返回模式
STREAMING_MODE = "streaming"
BLOCKING_MODE = "blocking"

# 工作流/Agent 的 API_KEY
API_KEY = "{your-key}"
BASE_URL = "https://api.dify.ai/v1"

WORKFLOW_FINISHED = "workflow_finished"
WORKFLOW_SUCCESS = "succeeded"


def stream_dify_workflow(target, api_key=API_KEY, base_url=BASE_URL, username="python_request", mode=STREAMING_MODE):
    url = f"{base_url}/chat-messages"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "query": target,
        "response_mode": "streaming",
        "conversation_id": "",
        "inputs": {

        },
        "user": username
    }

    # 用于保存最终提取出的输出内容
    final_output = ""

    try:
        with requests.post(url, headers=headers, json=payload, stream=True) as response:
            if response.status_code != 200:
                print(f"请求失败，状态码: {response.status_code}")
                print(response.text)
                return None

            print("=== 开始接收流式响应 ===")
            for line in response.iter_lines():
                if line:
                    decoded_line = line.decode('utf-8')

                    if decoded_line.startswith("data: "):
                        json_str = decoded_line[6:]

                        try:
                            json_data = json.loads(json_str)
                            event = json_data.get("event")

                            # 1. 解析 agent_thought 事件（包含思考过程和最终回答）
                            if event == "agent_thought":
                                raw_thought = json_data.get("thought", "")
                                if raw_thought:
                                    # 过滤掉 <think>...</think> 标签及其内部内容
                                    cleaned_text = re.sub(r'<think>.*?</think>', '', raw_thought, flags=re.DOTALL).strip()
                                    if cleaned_text:
                                        final_output = cleaned_text

                            # 2. 解析工作流完成事件 (若是 Workflow 模式)
                            elif event == WORKFLOW_FINISHED:
                                data = json_data.get("data", {})
                                if data.get("status") == WORKFLOW_SUCCESS:
                                    outputs = data.get("outputs", {})
                                    if outputs.get("output"):
                                        final_output = outputs.get("output")

                        except Exception as e:
                            print(f"JSON解析错误: {e}")
                            continue

            print("=== 流式响应结束 ===\n")
            return final_output

    except requests.exceptions.RequestException as e:
        print(f"请求发生错误: {e}")
        return None


if __name__ == "__main__":
    # final_result = stream_dify_workflow("2人,福州,厦门,3天2晚,3000元")
    final_result = stream_dify_workflow("1人,福州,夏威夷,7天6晚,300000元")

    # 单独打印最后的最终输出
    print("\n" + "=" * 20 + " 最终输出结果 " + "=" * 20)
    if final_result:
        print(final_result)
    else:
        print("未获取到有效的最终输出内容。")
    print("=" * 54)
```

结果为:

```json
=== 开始接收流式响应 ===
=== 流式响应结束 ===


==================== 最终输出结果 ====================
{
  "error": false,
  "message": "success",
  "data": {
    "trip_overview": {
      "travelers": "1人",
      "origin": "福州",
      "destination": "夏威夷",
      "duration": "7天6晚",
      "total_budget": 300000,
      "travel_style": "高端舒适型",
      "budget_summary": "单人7天6晚，预算30万元，安排国际商务舱、豪华海景酒店和精选岛屿活动，总预估花费25万元，预留5万元机动。",
      "estimated_total_cost": 250000,
      "reserve_budget": 50000
    },
    "daily_itinerary": [
      {
        "day": 1,
        "theme": "抵达与海岸初印象",
        "schedule": [
          {
            "time": "上午",
            "activity": "出发与转机",
            "details": "从福州长乐国际机场出发，经上海浦东或东京成田转机前往檀香山。建议预留充足转机时间，商务舱可选。",
            "transportation": "国际航班",
            "estimated_cost": 0
          },
          {
            "time": "下午",
            "activity": "抵达檀香山，入住怀基基酒店",
            "details": "抵达后专车接机，前往怀基基海滩区域的酒店办理入住，稍作休息。",
            "transportation": "专车接机",
            "estimated_cost": 0
          },
          {
            "time": "晚上",
            "activity": "怀基基海滩漫步与晚餐",
            "details": "在怀基基海滩散步，体验日落与街边氛围，晚餐可在酒店或附近知名餐厅解决。",
            "transportation": "步行",
            "estimated_cost": 0
          }
        ],
        "food_recommendations": [
          {
            "meal": "晚餐",
            "recommendation": "怀基基酒店内或附近高级餐厅（夏威夷融合菜）",
            "estimated_cost_per_person": 2000
          }
        ],
        "accommodation": {
          "area": "怀基基海滩（Waikiki Beach）",
          "type": "豪华海景酒店（如Halekulani / Royal Hawaiian）",
          "estimated_cost_per_night": 12000,
          "reason": "位于核心度假区，步行可达海滩，海景房体验佳，适合抵达后放松。"
        },
        "daily_estimated_cost": 86500
      },
      {
        "day": 2,
        "theme": "珍珠港与历史人文一日",
        "schedule": [
          {
            "time": "上午",
            "activity": "珍珠港与亚利桑那号纪念馆",
            "details": "参观珍珠港游客中心和纪念馆，了解二战历史。需提前预约，建议早点出发。",
            "transportation": "包车",
            "estimated_cost": 0
          },
          {
            "time": "下午",
            "activity": "伊奥拉尼皇宫与州议会大厦",
            "details": "前往檀香山市中心，参观夏威夷王室故宫和州府建筑，感受历史与城市风貌。",
            "transportation": "包车",
            "estimated_cost": 0
          },
          {
            "time": "晚上",
            "activity": "唐人街/阿罗哈塔晚餐",
            "details": "在唐人街或阿罗哈塔周边选择特色餐厅，享用融合菜，餐后可沿海边散步。",
            "transportation": "包车/步行",
            "estimated_cost": 0
          }
        ],
        "food_recommendations": [
          {
            "meal": "午餐",
            "recommendation": "当地海鲜餐厅（如Nico's Pier 38）",
            "estimated_cost_per_person": 2000
          },
          {
            "meal": "晚餐",
            "recommendation": "阿罗哈塔附近的日式或夏威夷餐厅",
            "estimated_cost_per_person": 2000
          }
        ],
        "accommodation": {
          "area": "怀基基海滩（Waikiki Beach）",
          "type": "豪华海景酒店（如Halekulani / Royal Hawaiian）",
          "estimated_cost_per_night": 12000,
          "reason": "延续首日住宿，减少换酒店折腾，便于在欧胡岛核心区游览。"
        },
        "daily_estimated_cost": 22000
      },
      {
        "day": 3,
        "theme": "自然奇景与夏威夷晚会",
        "schedule": [
          {
            "time": "上午",
            "activity": "钻石头山徒步",
            "details": "清晨前往钻石头山，登顶俯瞰檀香山全景与海岸线，全程约1.5小时。",
            "transportation": "包车",
            "estimated_cost": 0
          },
          {
            "time": "下午",
            "activity": "恐龙湾浮潜",
            "details": "前往恐龙湾自然保护区浮潜，需提前网上预约，欣赏珊瑚礁与热带鱼群。",
            "transportation": "包车",
            "estimated_cost": 0
          },
          {
            "time": "晚上",
            "activity": "夏威夷卢奥晚宴",
            "details": "参加传统夏威夷卢奥（Luau）晚宴，欣赏草裙舞与火把表演，度过难忘夜晚。",
            "transportation": "包车",
            "estimated_cost": 0
          }
        ],
        "food_recommendations": [
          {
            "meal": "午餐",
            "recommendation": "恐龙湾游客中心附近的夏威夷特色简餐",
            "estimated_cost_per_person": 3000
          },
          {
            "meal": "下午茶/小吃",
            "recommendation": "彩虹冰或当地水果杯",
            "estimated_cost_per_person": 3000
          },
          {
            "meal": "晚餐",
            "recommendation": "卢奥晚宴（含在活动费用中）",
            "estimated_cost_per_person": 0
          }
        ],
        "accommodation": {
          "area": "怀基基海滩（Waikiki Beach）",
          "type": "豪华海景酒店（如Halekulani / Royal Hawaiian）",
          "estimated_cost_per_night": 12000,
          "reason": "保持连续住宿，方便参加晚间卢奥活动后返回。"
        },
        "daily_estimated_cost": 29000
      },
      {
        "day": 4,
        "theme": "飞往茂宜，海岛小镇风情",
        "schedule": [
          {
            "time": "上午",
            "activity": "檀香山自由活动与出发",
            "details": "上午可在酒店泳池或海滩放松，或前往阿拉莫阿那中心购物，随后乘机飞往茂宜岛。",
            "transportation": "专车送机 + 岛内航班",
            "estimated_cost": 0
          },
          {
            "time": "下午",
            "activity": "抵达茂宜岛，前往拉海纳",
            "details": "在茂宜机场租车，前往历史小镇拉海纳，参观老街、港口与古榕树。",
            "transportation": "租车",
            "estimated_cost": 0
          },
          {
            "time": "晚上",
            "activity": "拉海纳晚餐与海边散步",
            "details": "在拉海纳海边欣赏夕阳，选择当地海鲜餐厅用餐，感受慢节奏度假氛围。",
            "transportation": "步行/租车",
            "estimated_cost": 0
          }
        ],
        "food_recommendations": [
          {
            "meal": "午餐",
            "recommendation": "檀香山或机上简餐",
            "estimated_cost_per_person": 1500
          },
          {
            "meal": "晚餐",
            "recommendation": "拉海纳海鲜餐厅（如Mama's Fish House，需预订）",
            "estimated_cost_per_person": 2500
          }
        ],
        "accommodation": {
          "area": "卡纳帕利海滩/拉海纳（Kaanapali）",
          "type": "豪华海滨度假村（如四季或威斯汀）",
          "estimated_cost_per_night": 18000,
          "reason": "茂宜岛西海岸核心度假区，海滩优质，度假设施丰富，适合连住放松。"
        },
        "daily_estimated_cost": 27500
      },
      {
        "day": 5,
        "theme": "哈雷阿卡拉日出与火山云海",
        "schedule": [
          {
            "time": "清晨",
            "activity": "哈雷阿卡拉火山日出",
            "details": "凌晨出发，前往哈雷阿卡拉国家公园山顶观赏日出，需穿保暖衣物，俯瞰月球般的火山地貌。",
            "transportation": "租车/观星团",
            "estimated_cost": 0
          },
          {
            "time": "上午",
            "activity": "火山口观景与短途徒步",
            "details": "在游客中心周边步道徒步，欣赏火山口与云海奇景，之后返回酒店休息。",
            "transportation": "租车",
            "estimated_cost": 0
          },
          {
            "time": "下午",
            "activity": "酒店海滩休闲或SPA",
            "details": "下午在卡纳帕利海滩享受阳光、浮潜或预约一次夏威夷特色SPA。",
            "transportation": "步行",
            "estimated_cost": 0
          },
          {
            "time": "晚上",
            "activity": "晚餐与海滩夜景",
            "details": "选择度假村内的餐厅或拉海纳镇用餐，餐后赏星空。",
            "transportation": "租车/步行",
            "estimated_cost": 0
          }
        ],
        "food_recommendations": [
          {
            "meal": "午餐",
            "recommendation": "度假村简餐或外带",
            "estimated_cost_per_person": 2000
          },
          {
            "meal": "晚餐",
            "recommendation": "高档餐厅（如Mama's Fish House或Merrill's）",
            "estimated_cost_per_person": 3000
          }
        ],
        "accommodation": {
          "area": "卡纳帕利海滩/拉海纳（Kaanapali）",
          "type": "豪华海滨度假村（如四季或威斯汀）",
          "estimated_cost_per_night": 18000,
          "reason": "继续入住茂宜岛度假村，省去换房烦恼，享受完整度假体验。"
        },
        "daily_estimated_cost": 33000
      },
      {
        "day": 6,
        "theme": "海洋探索与返回檀香山",
        "schedule": [
          {
            "time": "上午",
            "activity": "Molokini火山口浮潜",
            "details": "参加半日浮潜游船，前往Molokini新月形火山口，与海龟和热带鱼共游。",
            "transportation": "游船 + 接驳",
            "estimated_cost": 0
          },
          {
            "time": "下午",
            "activity": "返回檀香山",
            "details": "浮潜结束后回酒店取行李，前往茂宜机场，飞回檀香山，入住机场附近或怀基基酒店。",
            "transportation": "岛内航班 + 接机",
            "estimated_cost": 0
          },
          {
            "time": "晚上",
            "activity": "怀基基购物与告别晚餐",
            "details": "在怀基基购物区购买伴手礼，晚餐选择海景餐厅，享受在夏威夷的最后一夜。",
            "transportation": "专车/步行",
            "estimated_cost": 0
          }
        ],
        "food_recommendations": [
          {
            "meal": "午餐",
            "recommendation": "游船简餐或当地餐车",
            "estimated_cost_per_person": 1500
          },
          {
            "meal": "晚餐",
            "recommendation": "怀基基海景餐厅",
            "estimated_cost_per_person": 2500
          }
        ],
        "accommodation": {
          "area": "怀基基海滩/檀香山",
          "type": "高档酒店（海景房）",
          "estimated_cost_per_night": 8000,
          "reason": "方便次日前往机场，同时可再享海滩夜景，减少旅途疲劳。"
        },
        "daily_estimated_cost": 21000
      },
      {
        "day": 7,
        "theme": "返程，满载而归",
        "schedule": [
          {
            "time": "上午",
            "activity": "酒店早餐与最后采购",
            "details": "在酒店享用早餐，办理退房，前往机场前可再购买巧克力、咖啡等夏威夷伴手礼。",
            "transportation": "专车送机",
            "estimated_cost": 0
          },
          {
            "time": "下午",
            "activity": "前往机场，办理登机",
            "details": "提前3小时抵达檀香山国际机场，办理退税、安检和登机手续，搭乘国际航班返回。",
            "transportation": "国际航班",
            "estimated_cost": 0
          },
          {
            "time": "晚上",
            "activity": "中转/飞行中",
            "details": "在航班上休息，整理旅途照片，期待下一次出发。",
            "transportation": "国际航班",
            "estimated_cost": 0
          }
        ],
        "food_recommendations": [
          {
            "meal": "早餐",
            "recommendation": "酒店自助早餐",
            "estimated_cost_per_person": 1000
          },
          {
            "meal": "机上餐食",
            "recommendation": "商务舱餐食及机场贵宾厅",
            "estimated_cost_per_person": 4000
          }
        ],
        "accommodation": {
          "area": "不适用（离开日）",
          "type": "无住宿",
          "estimated_cost_per_night": 0,
          "reason": "当天返回中国，无住宿需求。"
        },
        "daily_estimated_cost": 31000
      }
    ],
    "expense_breakdown": {
      "transportation": {
        "amount": 90000,
        "details": "福州往返檀香山商务舱机票、檀香山-茂宜岛往返机票、当地包车/租车/油费/停车及接送机预估。"
      },
      "accommodation": {
        "amount": 80000,
        "details": "6晚住宿：欧胡岛3晚、茂宜岛2晚、檀香山1晚，均为高品质海景酒店或度假村。"
      },
      "food": {
        "amount": 30000,
        "details": "每日正餐、特色晚餐、小吃饮品及机上餐食预估，含高档餐厅体验。"
      },
      "tickets": {
        "amount": 20000,
        "details": "珍珠港、钻石头山、恐龙湾、卢奥秀、哈雷阿卡拉日出团、Molokini浮潜等门票及体验项目预估。"
      },
      "other": {
        "amount": 30000,
        "details": "旅游保险、小费、购物伴手礼、SPA及临时机动支出预估。"
      },
      "estimated_total": 250000,
      "budget": 300000,
      "remaining_budget": 50000
    },
    "travel_tips": [
      "国际航班建议至少提前2个月预订，商务舱价格波动较大，尽早锁定可以更划算。",
      "珍珠港、恐龙湾、哈雷阿卡拉日出等地需提前预约或确认开放时间，避免当天无法进入。",
      "夏威夷租车可用中国驾照配合翻译件，注意左舵驾驶与当地交规；茂宜岛山路较多，驾驶需谨慎。",
      "夏威夷物价较高，建议预留10%左右机动资金，并购买涵盖自驾与医疗的旅行保险。",
      "实际支出受出行日期、酒店库存、油价及汇率影响，以上价格均为人民币预估。"
    ]
  }
}
======================================================
```



### 5.3 代码里最关键的三件事

这段代码最值得你真正看懂的，不是语法，而是这三件事：

1. 通过 `Authorization: Bearer ...` 完成身份认证。
2. 通过 `inputs` 把业务参数传给工作流。
3. 通过监听 `workflow_finished` 事件拿到最终结果。

### 5.4 本地部署版 Dify 怎么改？

如果你调用的是自己部署的 Dify，通常只需要把环境变量改成：

```bash
export DIFY_BASE_URL=http://localhost/v1
export DIFY_API_KEY=your_api_key
```

Windows PowerShell 可改成：

```powershell
$env:DIFY_BASE_URL="http://localhost/v1"
$env:DIFY_API_KEY="your_api_key"
```

------

## 6、怎么读懂流式日志

### 6.1 日志分为两类

#### 1. 以 data: 开头

这类是真正的工作流运行日志。

```text
decoded_line: data: {"event": "iteration_next", ...}
```

#### 2. 以 event: 开头

这类通常是通信层心跳或事件类型提示。

```text
decoded_line: event: ping
```

### 6.2 真正要抓住的主线

```text
workflow_started
-> node_started / node_finished（每个节点的开始与结束）
-> iteration_next（如果有循环或迭代）
-> workflow_finished
```

一个更适合阅读的日志片段如下：

```text
=== 开始接收流式响应 ===
decoded_line: data: {"event":"workflow_started", ...}
decoded_line: data: {"event":"node_started", "data":{"title":"开始", ...}}
decoded_line: data: {"event":"node_finished", "data":{"title":"开始", "status":"succeeded", ...}}
decoded_line: data: {"event":"node_started", "data":{"title":"谷歌搜索", ...}}
decoded_line: data: {"event":"node_finished", "data":{"title":"谷歌搜索", "status":"succeeded", ...}}
decoded_line: data: {"event":"workflow_finished", "data":{"status":"succeeded", "outputs":{...}}}
```

这些事件分别对应工作流的不同阶段：`workflow_started` 表示整次工作流开始执行，`node_started / node_finished` 表示某个具体节点开始或结束，`workflow_finished` 则表示整次流程结束，并会在 `outputs` 中给出最终结果。

### 6.3 为什么不建议把完整正文原样打印进文档

如果你的工作流输出是一篇长文，不建议把整篇正文原样打印进教学文档。真实项目里更常见的做法是：

1. 在日志里确认 `status` 是否为 `succeeded`
2. 从 `outputs` 中取出最终字段
3. 只打印前几百个字符做调试预览
4. 需要完整内容时再写入文件、数据库或上层接口响应

例如：

```python
final_text = outputs["output"][0]
print(final_text[:300])
```

### 6.4 查看 Dify 后台日志

对比 Dify 后台日志和 Python 控制台日志，最终运行结果应该能互相对应。

![Dify 后台日志与 Python 控制台日志对照的界面示意图](https://didilili.github.io/ai-agents-from-zero/images/4/4-6-4-1.png)

![Dify 后台详细运行日志与节点执行信息的界面示意图](https://didilili.github.io/ai-agents-from-zero/images/4/4-6-4-2.png)

------

## 7、真实项目里最常见的排查顺序

如果 API 调用失败，建议按下面顺序排查：

1. **先看平台**：工作流是否已发布、API Key 是否对应这个工作流。
2. **再看请求**：URL、Header、`inputs` 字段名、变量类型是否正确。
3. **再看事件流**：有没有收到 `workflow_finished`，`status` 是不是 `succeeded`。
4. **最后看后台日志**：哪一个节点出错，是否是平台内部逻辑问题。

这条顺序比“哪里报错就盯哪里”更稳定，因为它把问题分成了**入口层、请求层、执行层、平台层**四个层次。

------

**章节思考题：**

1. 从页面里的 Dify 工作流，到 Python 代码调用，中间必须确认哪几个点？

   **参考思路：** 先确认工作流已发布，再确认 API Key、调用地址、`inputs` 字段、`response_mode`、`user` 和日志入口。页面能跑只是第一步，代码侧还要验证鉴权、参数和返回事件是否一致。

2. 如果接口返回异常，你会如何判断是工作流没发布、鉴权错误、入参错误，还是事件解析错误？

   **参考思路：** 先看 HTTP 状态码和平台日志；401/403 优先查 Key，404 或找不到应用查发布和地址，参数报错查 `inputs`，代码没拿到最终结果再查流式事件解析。不要一上来就改工作流节点。

3. 为什么调用工作流时不能只关心最终文本，还要看中间事件？

   **参考思路：** 流式事件能告诉你工作流执行到了哪一步、哪个节点报错、最终输出来自哪个事件。真实项目里排障、进度展示和超时处理都依赖这些中间信息。

**本章小结：**

- **调用前提**：Dify 工作流必须先发布，并创建与之绑定的 API Key。
- **调用核心**：最关键的请求要素是 URL、Authorization、`inputs`、`response_mode` 和 `user`；它们共同决定“调哪个工作流、用什么身份、传什么输入、怎么拿结果”。
- **返回模式要分清**：`blocking` 适合简单调用，`streaming` 更适合真实项目调试与长流程任务。
- **排查主线**：本章最重要的不是背某段代码，而是掌握一条稳定排查路径：**平台先发布并调通 -> Postman / curl 验证 -> Python 接入 -> Dify 日志对照排查**。

**建议下一步：**

- 如果你还要继续接 Coze 平台工作流，进入Python 调用 Coze 平台工作流。
- 如果你想把平台能力和 Agent 原理连接起来，进入  Agent 智能体。
- 如果你准备部署自己的 Dify 环境，进入  Dify 的安装和启动 或  企业级大模型部署。
