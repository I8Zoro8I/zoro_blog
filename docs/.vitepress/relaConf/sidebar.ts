import {DefaultTheme} from 'vitepress';
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
                // 在已有的 existingGroup 判断逻辑内部：
                if (!existingGroup) {
                    (sidebar[sidebarKey] as any[]).push({
                        text: group.name,
                        collapsed: true,
                        // 这里对 group.links 进行映射转换
                        items: group.links.map((l: any) => {
                            // 如果这个 link 拥有嵌套的子级 items
                            if (l.items && l.items.length > 0) {
                                return {
                                    text: l.title,
                                    collapsed: true, // 让这一级也可以折叠
                                    items: l.items.map((subLink: any) => ({
                                        text: subLink.title,
                                        link: subLink.url
                                    }))
                                };
                            } else {
                                // 如果没有子级，依然按照标准叶子节点渲染
                                return {
                                    text: l.title,
                                    link: l.url
                                };
                            }
                        })
                    });
                }
            }
        });
    });
});