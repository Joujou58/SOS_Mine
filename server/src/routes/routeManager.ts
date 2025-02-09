
import express, { Router, Request, Response, RequestHandler } from 'express';
import path from 'path';


class RouteManager {
    private router: Router;
    private frontendPagesPath: string;

    constructor(frontendPagesPath: string) {
        this.frontendPagesPath = frontendPagesPath;
        this.router = express.Router();
    }

    public initializeRoutes(): Router {
        this.initializePageRoutes();
        this.initializeResources();
        
        return this.router;
    }
    private initializePageRoutes(): void {
        this.addRoute('/', [], 'main');
    }

    private initializeResources() {
        this.router.use(express.static(this.frontendPagesPath));        
    }

    private addRoute(pageName: string, middlewares: RequestHandler[] = [], differentPath?: string) {
        this.router.get('/' + pageName, middlewares, (req: Request, res: Response) => {
            res.sendFile(path.join(this.frontendPagesPath,'pages', `${differentPath ?? pageName}.html`), function (err) {});
        });
    }
}

export default RouteManager;
