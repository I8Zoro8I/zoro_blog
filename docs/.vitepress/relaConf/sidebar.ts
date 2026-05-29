import {DefaultTheme} from 'vitepress';
// @ts-ignore
import categoriesData from './categories.json';

export const sidebar: DefaultTheme.Sidebar = {};

/**
 * 安全提取 URL 路径前缀的辅助函数
 * 例如将 "/column/AI/math/01linearAlgebra" 提取出 "/column/AI/"
 */
function getSidebarKey(url: string | undefined): string | null {
    if (!url) return null;
    const pathParts = url.split('/');
    if (pathParts.length >= 3) {
        return `/${pathParts[1]}/${pathParts[2]}/`;
    }
    return null;
}

categoriesData.categories?.forEach((cat: any) => {
    (cat.children || []).forEach((group: any) => {
        (group.links || []).forEach((link: any) => {

            // 1. 动态确定当前节点的 sidebarKey
            let sidebarKey: string | null = null;
            if (link.url) {
                sidebarKey = getSidebarKey(link.url);
            } else if (link.items && link.items.length > 0) {
                // 如果是嵌套的多级节点，取它下面第一个子链接的路径作为 key
                sidebarKey = getSidebarKey(link.items[0].url);
            }

            // 如果找不到合法的路径前缀，跳过该节点防止报错
            if (!sidebarKey) return;

            // 2. 初始化该路径的侧边栏数组
            if (!sidebar[sidebarKey]) {
                sidebar[sidebarKey] = [];
            }

            // 3. 检查当前侧边栏分组中是否已经添加过同名的 group
            const currentSidebar = sidebar[sidebarKey] as any[];
            // 替换原有的 currentSidebar.find 逻辑
            let existingGroup = null;
            for (let j = 0; j < currentSidebar.length; j++) {
                if (currentSidebar[j].text === group.name) {
                    existingGroup = currentSidebar[j];
                    break;
                }
            }

            if (!existingGroup) {
                // 创建全新的分组架构
                existingGroup = {
                    text: group.name,
                    collapsed: true,
                    items: []
                };
                currentSidebar.push(existingGroup);
            }

            // 4. 将当前的 link（单篇或嵌套多篇）安全注入到 items 列表中
            // 避免因重复遍历而重复添加
            const isAlreadyAdded = existingGroup.items.some((item: any) => item.text === link.title);
            if (!isAlreadyAdded) {
                if (link.items && link.items.length > 0) {
                    // 🌟 核心修复：处理拥有二级items嵌套的深度节点
                    existingGroup.items.push({
                        text: link.title,
                        collapsed: true, // 允许这一级子菜单在前端展开/折叠
                        items: link.items.map((sub: any) => ({
                            text: sub.title,
                            link: sub.url
                        }))
                    });
                } else if (link.url) {
                    // 处理普通单篇叶子节点
                    existingGroup.items.push({
                        text: link.title,
                        link: link.url
                    });
                }
            }
        });
    });
});