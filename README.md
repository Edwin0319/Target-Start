app網址: target-start.vercel.app
github代碼庫: https://github.com/Edwin0319/Target-Start




文件夹	作用	对应项目需求
views/	
对应项目的五个主要页面 。



页面切换应通过程序内部切换完成，而不是 URL 重定向 。

components/MapEditor/	专门用于地图编辑页的复杂组件。	
地图网格、工具箱 (Toolbox) 、关卡切换按钮 、主页/导入/导出按钮 。



components/Game/	专门用于游戏页的组件。	
游戏界面 (Game Interface) 、生命值显示 、计时器显示 、暂停按钮 。



stores/	集中管理游戏状态。	
确保地图元素在关卡切换时能被存储和重新显示 。管理 Demo 模式和挑战模式下的不同状态 。


assets/styles/	存放样式指南。	
确保所有按钮和游戏元素具有统一风格的样式
