import { DevModule, DI, TestModule } from '@core/modules';
import { DashboardService } from '@core/services/DashboardService';
import { HttpTestModule } from '@core/modules/http.test.modules';

describe('DashboardService with data from server', () => {
  let dashboardService: DashboardService;

  before(() => {
    DI.init([new HttpTestModule(), new TestModule()]);
    dashboardService = DI.get<DashboardService>(DashboardService);
    // const authService = DI.get<AuthenticationService>(AuthenticationService);
    // Log.debug('dashboardService is DashboardServiceImpl::', dashboardService instanceof DashboardServiceImpl);
  });

  // let dashboardId: number;
  // it('should create dashboard success', async () => {
  //   const exampleDashboard: CreateDashboardRequest = {
  //     name: 'Example dashboard',
  //     parentDirectoryId: -1
  //   };
  //   const dashboard = await dashboardService.create(exampleDashboard);
  //   expect(dashboard).be.not.null;
  //   dashboardId = dashboard.id;
  // });
  //
  // it('should get dashboard success', async () => {
  //   const dashboard = await dashboardService.get(dashboardId);
  //   expect(dashboard);
  //   expect(dashboard.id).eq(dashboardId);
  //   expect(dashboard.mainDateFilter).is.undefined;
  //   expect(dashboard.name).not.empty;
  // });
  //
  // it('should rename dashboard success', async () => {
  //   const success = await dashboardService.rename(dashboardId, 'dashboard renamed');
  //   expect(success).is.ok;
  //   expect(success).eq(true);
  // });
  //
  // let widgetId = -1;
  // it('should create widget success', async () => {
  //   const filter: DateFilter = new DateFilter({ id: 1, name: '', description: '' });
  //   const position: Position = new Position(1, 2, 3, 4);
  //   const createdWidget = await dashboardService.createWidget(dashboardId, filter, position);
  //   expect(createdWidget).be.not.null;
  //   widgetId = createdWidget.id;
  // });
  //
  // it('should get widget success', async () => {
  //   const widget = await dashboardService.getWidget(dashboardId, widgetId);
  //   expect(widget).be.not.null;
  //   expect(widget.id).eq(widgetId);
  //   expect(widget.className).eq('date_filter');
  //   const dateFilter: DateFilter = widget as DateFilter;
  //   expect(dateFilter).not.null;
  // });
  //
  // it('should edit widget success', async () => {
  //   const newFilter: DateFilter = new DateFilter({ id: 1, name: '', description: '' });
  //   const success = await dashboardService.editWidget(dashboardId, widgetId, newFilter);
  //   expect(success).is.ok;
  //   expect(success).eq(true);
  // });
  //
  // it('should resize widgets success', async () => {
  //   const positions = {
  //     [widgetId]: new Position(1, 1, 1, 1)
  //   };
  //   const success = await dashboardService.resizeWidgets(dashboardId, positions);
  //   expect(success).is.ok;
  //   expect(success).eq(true);
  // });
  //
  // it('should delete widget success', async () => {
  //   const success = await dashboardService.deleteWidget(dashboardId, widgetId);
  //   expect(success).is.ok;
  //   expect(success).eq(true);
  // });
  //
  // it('should delete dashboard success', async () => {
  //   const success = await dashboardService.delete(dashboardId);
  //   expect(success).is.ok;
  //   expect(success).eq(true);
  // });
  //
  // it('should share link', async () => {
  //   const dashboardId = 56;
  //   const success = await dashboardService.share(dashboardId);
  //   expect(success).is.string('ff211ed2-b837-4af6-937f-1e86efc9d92f');
  // });
});
