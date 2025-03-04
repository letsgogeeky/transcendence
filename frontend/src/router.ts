type Route = { path: string, component: () => Promise<HTMLElement>; title: string };

const routes: Route[] = [
    { path: "/", component: () => import("./pages/home").then(c => c.renderHome()), title: "Orca's Home"},
    { path: "*", component: () => import("./pages/notfound").then(c => c.renderNotFound()), title: "Sorry!" },
]


export async function navigateTo(hash: string) {
    const route = routes.find(r => r.path == hash) || routes.find(r => r.path === "*");
    if (route) {
        const component = await route.component();
        document.getElementById("app")!.innerHTML = "";
        document.getElementById("app")?.appendChild(component);
    }
}

export function setupRouter() {
    window.addEventListener("hashchange", () => navigateTo(location.hash.slice(1) || "/"));
    navigateTo(location.hash.slice(1) || "/");
}