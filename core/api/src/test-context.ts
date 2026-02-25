import {ITestQueuedTestRunData} from '@ringai/types';
import {loggerClient} from '@ringai/logger';
import {transport} from '@ringai/transport';
import {WebApplication} from '@ringai/web-application';
import {testAPIController, TestAPIController} from './test-api-controller';

const LOG_PREFIX = '[logged inside test]';

export class TestContext {
    private lastLoggedBusinessMessage: string | null = null;

    private customApplications: Set<WebApplication> = new Set();

    private apiController: TestAPIController;

    constructor(_config: any, apiController?: TestAPIController) {
        this.apiController = apiController || testAPIController;
    }

    public get application(): WebApplication {
        const runData = this.getRunData();

        const value = new WebApplication(
            this.apiController.getTestID(),
            transport,
            runData,
        );

        Object.defineProperty(this, 'application', {
            value,
            enumerable: false,
            configurable: true,
            writable: true,
        });

        return value;
    }

    public async logBusiness(message: string) {
        await this.stopLogBusiness();

        this.lastLoggedBusinessMessage = message;

        loggerClient.startStep(message);
    }

    public async stopLogBusiness() {
        if (this.lastLoggedBusinessMessage !== null) {
            loggerClient.endStep(this.lastLoggedBusinessMessage);

            this.lastLoggedBusinessMessage = null;
        }
    }

    public async log(...message: Array<any>) {
        loggerClient.info(LOG_PREFIX, ...message);
    }

    public async logError(...message: Array<any>) {
        loggerClient.error(LOG_PREFIX, ...message);
    }

    public async logWarning(...message: Array<any>) {
        loggerClient.warn(LOG_PREFIX, ...message);
    }

    protected getRunData(): ITestQueuedTestRunData {
        return this.getParameters().runData;
    }

    public getParameters(): any {
        return this.apiController.getTestParameters();
    }

    public getEnvironment(): any {
        return this.apiController.getEnvironmentParameters();
    }

    public initCustomApplication<T extends WebApplication>(Ctr: {
        new (...args: Array<any>): T;
    }) {
        const runData = this.getRunData();
        const customApplication = new Ctr(
            this.apiController.getTestID(),
            transport,
            runData,
        );

        this.customApplications.add(customApplication);

        return customApplication;
    }

    public getCustomApplicationsList() {
        return [...this.customApplications];
    }

    public end(): Promise<any> {
        const requests = this.application.isStopped()
            ? []
            : [this.application.end()];

        for (const customApplication of this.customApplications) {
            if (!customApplication.isStopped()) {
                requests.push(customApplication.end());
            }
        }

        return Promise.all(requests).catch((error) => {
            this.logError(error);
        });
    }

    public cloneInstance<O>(obj: O): TestContext & O {
        const copy: this & O = Object.assign(
            Object.create(Object.getPrototypeOf(this)),
            this,
            obj,
        );
        Object.assign(copy.constructor, this.constructor);

        return copy;
    }
}
