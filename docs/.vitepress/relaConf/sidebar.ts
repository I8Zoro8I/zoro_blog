// import {DefaultTheme} from 'vitepress';
//
// export const sidebar: DefaultTheme.Sidebar = {
//
//     // /column/Algothm/表示对这个文件夹下的所有md文件做侧边栏配置
//     '/column/Algorithm/': [
//         {
//
//             text: '首页',
//             link: '/column/Algorithm/index'
//         },
//         // 第一部分
//         {
//
//             text: '栈和队列',
//             items: [
//                 {
//
//                     text: '栈-深拷贝和浅拷贝',
//                     link: '/column/Algorithm/001_Stack'
//                 },
//                 {
//
//                     text: '队列-事件循环',
//                     link: '/column/Algorithm/002_Queue'
//                 }
//             ]
//         },
//         // 第二部分
//         {
//
//             text: '字典和树',
//             items: [
//                 {
//
//                     text: '字典和集合-Set和Map',
//                     link: '/column/Algorithm/003_Dictionary'
//                 },
//                 {
//
//                     text: '树-深/广度优先遍历',
//                     link: '/column/Algorithm/004_Tree'
//                 }
//             ]
//         }
//     ]
// };

// import { DefaultTheme } from 'vitepress';
// import { categories } from './categories';
// // @ts-ignore
// import categoriesData from './cate.json';
//
// export const sidebar: DefaultTheme.Sidebar = {};
//
// // 将 JSON 数据转换为 VitePress 要求的格式
// categoriesData.categories.forEach((cat: any) => {
//     const sidebarKey = `/column/${cat.id}/`;
//
//     // 生成该分类下的数组
//     sidebar[sidebarKey] = [
//         // 自动添加一个首页
//         { text: `${cat.title}首页`, link: `${sidebarKey}index` },
//         // 循环 JSON 中的分组
//         ...cat.groups.map((group: any) => ({
//             text: group.groupName,
//             collapsed: false,
//             items: group.items.map((item: any) => ({
//                 text: item.text,
//                 link: item.link
//             }))
//         }))
//     ];
// });
import { DefaultTheme } from 'vitepress';
// @ts-ignore
import categoriesData from './categories.json';

export const sidebar: DefaultTheme.Sidebar = {};

categoriesData.categories?.forEach((cat: any) => {
    // 动态生成路径 Key，例如 "/column/Algorithm/"
    const sidebarKey = `/column/${cat.id}/`;

    sidebar[sidebarKey] = [
        // 第一层：该分类的首页
        { text: `${cat.name}概览`, link: `${sidebarKey}index` },
        // 第二层：循环 children 映射为侧边栏的分组
        ...(cat.children || []).map((group: any) => ({
            text: group.name,
            collapsed: false,
            // 第三层：循环 links 映射为具体的文章
            items: (group.links || []).map((link: any) => ({
                text: link.title,
                link: link.url
            }))
        }))
    ];
});