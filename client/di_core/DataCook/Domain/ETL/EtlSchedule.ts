// import { ETL_SCHEDULE_TYPE, DAY_OF_WEEK } from './EtlEnum';
//
// export abstract class EtlSchedule {
//   protected constructor(public className: ETL_SCHEDULE_TYPE) {}
//
//   static fromObject(obj: EtlSchedule): EtlSchedule {
//     switch (obj.className) {
//       case ETL_SCHEDULE_TYPE.ScheduleOnce:
//         // eslint-disable-next-line @typescript-eslint/no-use-before-define
//         return ScheduleOnce.fromObject(obj);
//       case ETL_SCHEDULE_TYPE.ScheduleHourly:
//         // eslint-disable-next-line @typescript-eslint/no-use-before-define
//         return ScheduleHourly.fromObject(obj);
//       case ETL_SCHEDULE_TYPE.ScheduleDaily:
//         // eslint-disable-next-line @typescript-eslint/no-use-before-define
//         return ScheduleDaily.fromObject(obj);
//       case ETL_SCHEDULE_TYPE.ScheduleWeekly:
//         // eslint-disable-next-line @typescript-eslint/no-use-before-define
//         return ScheduleWeekly.fromObject(obj);
//       case ETL_SCHEDULE_TYPE.ScheduleMonthly:
//         // eslint-disable-next-line @typescript-eslint/no-use-before-define
//         return ScheduleMonthly.fromObject(obj);
//       case ETL_SCHEDULE_TYPE.NoneSchedule:
//       default:
//         // eslint-disable-next-line @typescript-eslint/no-use-before-define
//         return NoneSchedule.fromObject(obj);
//     }
//   }
// }
//
// export class NoneSchedule extends EtlSchedule {
//   constructor() {
//     super(ETL_SCHEDULE_TYPE.NoneSchedule);
//   }
//
//   static fromObject(obj: EtlSchedule): EtlSchedule {
//     return new NoneSchedule();
//   }
// }
//
// export class ScheduleOnce extends EtlSchedule {
//   constructor(public time: number) {
//     super(ETL_SCHEDULE_TYPE.ScheduleOnce);
//   }
//
//   static fromObject(obj: EtlSchedule): EtlSchedule {
//     return new ScheduleOnce((obj as ScheduleOnce).time);
//   }
// }
//
// export class ScheduleHourly extends EtlSchedule {
//   constructor(public recurEvery: number) {
//     super(ETL_SCHEDULE_TYPE.ScheduleHourly);
//   }
//
//   static fromObject(obj: EtlSchedule): EtlSchedule {
//     return new ScheduleHourly((obj as ScheduleHourly).recurEvery);
//   }
// }
//
// export class ScheduleDaily extends EtlSchedule {
//   constructor(public recurEvery: number, public atTime: number) {
//     super(ETL_SCHEDULE_TYPE.ScheduleDaily);
//   }
//
//   static fromObject(obj: EtlSchedule): EtlSchedule {
//     const temp = obj as ScheduleDaily;
//     return new ScheduleDaily(temp.recurEvery, temp.atTime);
//   }
// }
//
// export class ScheduleWeekly extends EtlSchedule {
//   constructor(public recurEvery: number, public atTime: number, public excludeDays: DAY_OF_WEEK[]) {
//     super(ETL_SCHEDULE_TYPE.ScheduleWeekly);
//   }
//
//   static fromObject(obj: EtlSchedule): EtlSchedule {
//     const temp = obj as ScheduleWeekly;
//     return new ScheduleWeekly(temp.recurEvery, temp.atTime, temp.excludeDays);
//   }
// }
//
// export class ScheduleMonthly extends EtlSchedule {
//   constructor(public recurOnDays: number, public recurEveryMonth: number, public atTime: number) {
//     super(ETL_SCHEDULE_TYPE.ScheduleMonthly);
//   }
//
//   static fromObject(obj: EtlSchedule): EtlSchedule {
//     const temp = obj as ScheduleMonthly;
//     return new ScheduleMonthly(temp.recurOnDays, temp.recurEveryMonth, temp.atTime);
//   }
// }
