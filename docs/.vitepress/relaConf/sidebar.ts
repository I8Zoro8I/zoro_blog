import { DefaultTheme } from 'vitepress';
// @ts-ignore
import categoriesData from './categories.json';

export const sidebar: DefaultTheme.Sidebar = {};

categoriesData.categories?.forEach((cat: any) => {
    // 方案：遍历 children 下的所有链接，提取它们共同的父路径作为 Key
    (cat.children || []).forEach((group: any) => {
        (group.links || []).forEach((link: any) => {
            // 通过正则或分割字符串获取路径前缀
            // 例如从 "/column/Algorithm/001_Stack" 提取出 "/column/Algorithm/"
            const pathParts = link.url.split('/');
            if (pathParts.length >= 3) {
                const sidebarKey = `/${pathParts[1]}/${pathParts[2]}/`;

                // 如果该路径的侧边栏还没初始化，则初始化
                if (!sidebar[sidebarKey]) {
                    sidebar[sidebarKey] = [];
                }

                // 将该 group 加入到对应的侧边栏中
                // 检查是否已经存在同名分组，避免重复添加
                // @ts-ignore
                const existingGroup = (sidebar[sidebarKey] as any[]).find(g => g.text === group.name);
                if (!existingGroup) {
                    (sidebar[sidebarKey] as any[]).push({
                        text: group.name,
                        collapsed: false,
                        items: group.links.map((l: any) => ({
                            text: l.title,
                            link: l.url
                        }))
                    });
                }
            }
        });
    });
});