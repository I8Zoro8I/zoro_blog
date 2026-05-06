// 定义类型以便后续维护（可选）
export interface Category {
    name: string;
    icon?: string;
    children?: Category[];
    links?: { title: string; url: string }[];
}

export const categories: Category[] = [
    {
        name: '动漫专栏',
        icon: '📺',
        children: [
            {
                name: '日本动漫',
                links: [
                    { title: '进击的巨人', url: '/column/fan/shingeki' },
                    { title: '海贼王', url: '/column/fan/onepiece' }
                ]
            },
            {
                name: '国产动漫',
                links: [
                    { title: '凡人修仙传', url: '/column/fan/fanren' }
                ]
            }
        ]
    },
    {
        name: '开发技术',
        icon: '💻',
        children: [
            {
                name: '数据结构',
                links: [
                    { title: '栈与队列', url: '/column/Algorithm/001_Stack' },
                    { title: '字典与树', url: '/column/Algorithm/003_Dictionary' }
                ]
            }
        ]
    }
];