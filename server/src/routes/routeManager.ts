
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
        this.initializeApiRoutes();

        this.initializeResources();
        
        return this.router;
    }
    private initializePageRoutes(): void {
        // Public pages
        this.addRoute('/', [], 'main');
        // this.addRoute('login');
        // this.addRoute('markdown');
        // this.addRoute('events');
        // this.addRoute('rules-and-lore');
    }

    private initializeApiRoutes(): void {
        // Api routes
        // this.router.use('/api/auth', authRoute);
        // this.router.use('/api/account', accountRoute);
        // this.router.use('/api/images', imagesRoute);
        // this.router.use('/api/events', eventsRoute);
        // this.router.use('/api/character', characterRoute);
        // this.router.use('/api/rules', rulesRoute);
        // this.router.use('/api/payment', paymentRoute);
    }

    private initializeResources() {
        this.router.use(express.static(this.frontendPagesPath));        
    }

    private addRoute(pageName: string, middlewares: RequestHandler[] = [], differentPath?: string) {
        this.router.get('/' + pageName, middlewares, (req: Request, res: Response) => {
            res.sendFile(path.join(this.frontendPagesPath,'pages', `${differentPath ?? pageName}.html`), function (err) {
                // console.log("The page doesnt exist")
            });
        });
    }
}

export default RouteManager;
