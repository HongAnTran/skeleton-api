import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  EmployeeReportDto,
  EmployeeReportResponse,
} from './dto/employee-report.dto';
import { ShiftReportDto, ShiftReportResponse } from './dto/shift-report.dto';
import {
  DepartmentReportDto,
  DepartmentReportResponse,
} from './dto/department-report.dto';
import {
  AttendanceReportDto,
  AttendanceReportResponse,
} from './dto/attendance-report.dto';
import {
  DashboardDto,
  DashboardResponse,
  DashboardStats,
  RecentActivity,
  TopPerformer,
  ShiftTrend,
  DepartmentPerformance,
} from './dto/dashboard.dto';
import { ShiftSignupStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getEmployeeReport(
    queryDto: EmployeeReportDto,
  ): Promise<EmployeeReportResponse[]> {
    const { startDate, endDate, branchId, departmentId } = queryDto;

    const where: any = {
      slot: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    };

    if (branchId) {
      where.slot.branchId = branchId;
    }

    if (departmentId) {
      where.slot.departmentId = departmentId;
    }

    const shiftSignups = await this.prisma.shiftSignup.findMany({
      where,
      include: {
        employee: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
            branch: {
              select: {
                name: true,
              },
            },
            department: {
              select: {
                name: true,
              },
            },
          },
        },
        slot: {
          include: {
            type: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Group by employee
    const employeeMap = new Map<string, any>();

    shiftSignups.forEach((signup) => {
      const employeeId = signup.employeeId;
      if (!employeeMap.has(employeeId)) {
        employeeMap.set(employeeId, {
          employeeId: signup.employee.id,
          employeeName: signup.employee.user.name,
          branchName: signup.employee.branch.name,
          departmentName: signup.employee.department.name,
          totalShifts: 0,
          totalHours: 0,
          shifts: [],
        });
      }

      const employee = employeeMap.get(employeeId);
      employee.totalShifts += 1;
      employee.totalHours += signup.totalHours;
      employee.shifts.push({
        id: signup.id,
        slotId: signup.slotId,
        date: signup.slot.date,
        totalHours: signup.totalHours,
        status: signup.status,
        shiftType: signup.slot.type.name,
      });
    });

    // Calculate averages
    const results = Array.from(employeeMap.values()).map((employee) => ({
      ...employee,
      averageHoursPerShift:
        employee.totalShifts > 0
          ? employee.totalHours / employee.totalShifts
          : 0,
    }));

    return results;
  }

  async getShiftReport(queryDto: ShiftReportDto): Promise<ShiftReportResponse> {
    const { startDate, endDate, branchId, departmentId } = queryDto;

    const where: any = {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    if (branchId) {
      where.branchId = branchId;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    const shifts = await this.prisma.shiftSlot.findMany({
      where,
      include: {
        branch: {
          select: {
            name: true,
          },
        },
        department: {
          select: {
            name: true,
          },
        },
        type: {
          select: {
            name: true,
          },
        },
        signups: {
          include: {
            employee: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const totalShifts = shifts.length;
    const totalCapacity = shifts.reduce(
      (sum, shift) => sum + shift.capacity,
      0,
    );
    const totalSignups = shifts.reduce(
      (sum, shift) => sum + shift.signups.length,
      0,
    );
    const utilizationRate =
      totalCapacity > 0 ? (totalSignups / totalCapacity) * 100 : 0;

    return {
      totalShifts,
      totalCapacity,
      totalSignups,
      utilizationRate,
      shifts: shifts.map((shift) => ({
        id: shift.id,
        date: shift.date,
        capacity: shift.capacity,
        note: shift.note,
        branch: shift.branch.name,
        department: shift.department.name,
        type: shift.type.name,
        signups: shift.signups.map((signup) => ({
          id: signup.id,
          employeeName: signup.employee.user.name,
          totalHours: signup.totalHours,
          status: signup.status,
        })),
      })),
    };
  }

  async getDepartmentReport(
    queryDto: DepartmentReportDto,
  ): Promise<DepartmentReportResponse[]> {
    const { startDate, endDate, branchId } = queryDto;

    const where: any = {
      slot: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    };

    if (branchId) {
      where.slot.branchId = branchId;
    }

    const shiftSignups = await this.prisma.shiftSignup.findMany({
      where,
      include: {
        employee: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        slot: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            branch: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Group by department
    const departmentMap = new Map<string, any>();

    shiftSignups.forEach((signup) => {
      const departmentId = signup.slot.departmentId;
      if (!departmentMap.has(departmentId)) {
        departmentMap.set(departmentId, {
          departmentId: signup.slot.departmentId,
          departmentName: signup.slot.department.name,
          branchName: signup.slot.branch.name,
          totalEmployees: new Set(),
          totalShifts: 0,
          totalHours: 0,
        });
      }

      const department = departmentMap.get(departmentId);
      department.totalEmployees.add(signup.employeeId);
      department.totalShifts += 1;
      department.totalHours += signup.totalHours;
    });

    // Calculate results
    const results = Array.from(departmentMap.values()).map((dept) => ({
      departmentId: dept.departmentId,
      departmentName: dept.departmentName,
      branchName: dept.branchName,
      totalEmployees: dept.totalEmployees.size,
      totalShifts: dept.totalShifts,
      totalHours: dept.totalHours,
      averageHoursPerEmployee:
        dept.totalEmployees.size > 0
          ? dept.totalHours / dept.totalEmployees.size
          : 0,
      utilizationRate:
        dept.totalShifts > 0 ? (dept.totalHours / dept.totalShifts) * 100 : 0,
    }));

    return results;
  }

  async getAttendanceReport(
    queryDto: AttendanceReportDto,
  ): Promise<AttendanceReportResponse> {
    const { startDate, endDate, branchId, departmentId } = queryDto;

    const where: any = {
      slot: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    };

    if (branchId) {
      where.slot.branchId = branchId;
    }

    if (departmentId) {
      where.slot.departmentId = departmentId;
    }

    const shiftSignups = await this.prisma.shiftSignup.findMany({
      where,
      include: {
        employee: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
            branch: {
              select: {
                name: true,
              },
            },
            department: {
              select: {
                name: true,
              },
            },
          },
        },
        slot: {
          select: {
            date: true,
          },
        },
      },
    });

    // Get all employees in the system
    const allEmployees = await this.prisma.employee.findMany({
      where: {
        ...(branchId && { branchId }),
        ...(departmentId && { departmentId }),
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        branch: {
          select: {
            name: true,
          },
        },
        department: {
          select: {
            name: true,
          },
        },
      },
    });

    const totalEmployees = allEmployees.length;
    const totalShifts = shiftSignups.length;
    const totalHours = shiftSignups.reduce(
      (sum, signup) => sum + signup.totalHours,
      0,
    );

    // Group by day
    const attendanceByDay = new Map<
      string,
      { date: string; totalShifts: number; totalHours: number }
    >();
    shiftSignups.forEach((signup) => {
      const date = signup.slot.date.toISOString().split('T')[0];
      if (!attendanceByDay.has(date)) {
        attendanceByDay.set(date, { date, totalShifts: 0, totalHours: 0 });
      }
      const dayData = attendanceByDay.get(date);
      dayData.totalShifts += 1;
      dayData.totalHours += signup.totalHours;
    });

    // Group by employee
    const attendanceByEmployee = new Map<string, any>();
    shiftSignups.forEach((signup) => {
      const employeeId = signup.employeeId;
      if (!attendanceByEmployee.has(employeeId)) {
        attendanceByEmployee.set(employeeId, {
          employeeId: signup.employee.id,
          employeeName: signup.employee.user.name,
          branchName: signup.employee.branch.name,
          departmentName: signup.employee.department.name,
          totalShifts: 0,
          totalHours: 0,
        });
      }
      const employee = attendanceByEmployee.get(employeeId);
      employee.totalShifts += 1;
      employee.totalHours += signup.totalHours;
    });

    const averageAttendanceRate =
      totalEmployees > 0 ? (totalShifts / totalEmployees) * 100 : 0;

    return {
      totalEmployees,
      totalShifts,
      totalHours,
      averageAttendanceRate,
      attendanceByDay: Array.from(attendanceByDay.values()),
      attendanceByEmployee: Array.from(attendanceByEmployee.values()),
    };
  }

  async getDashboardData(queryDto: DashboardDto): Promise<DashboardResponse> {
    const { startDate, endDate, branchId, departmentId } = queryDto;

    // Set default date range if not provided (last 30 days)
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const actualStartDate = startDate ? new Date(startDate) : defaultStartDate;
    const actualEndDate = endDate ? new Date(endDate) : defaultEndDate;

    // Build where conditions
    const employeeWhere: any = {};
    const shiftWhere: any = {
      date: {
        gte: actualStartDate,
        lte: actualEndDate,
      },
    };
    const signupWhere: any = {
      slot: {
        date: {
          gte: actualStartDate,
          lte: actualEndDate,
        },
      },
    };

    if (branchId) {
      employeeWhere.branchId = branchId;
      shiftWhere.branchId = branchId;
      signupWhere.slot.branchId = branchId;
    }

    if (departmentId) {
      employeeWhere.departmentId = departmentId;
      shiftWhere.departmentId = departmentId;
      signupWhere.slot.departmentId = departmentId;
    }

    // Get basic counts
    const [
      totalEmployees,
      totalBranches,
      totalDepartments,
      totalShifts,
      shiftSignups,
      recentSignups,
      recentSwaps,
    ] = await Promise.all([
      this.prisma.employee.count({ where: employeeWhere }),
      this.prisma.branch.count(),
      this.prisma.department.count(),
      this.prisma.shiftSlot.count({ where: shiftWhere }),
      this.prisma.shiftSignup.findMany({
        where: signupWhere,
        include: {
          employee: {
            include: {
              branch: { select: { name: true } },
              department: { select: { name: true } },
            },
          },
          slot: {
            include: {
              branch: { select: { name: true } },
              department: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.shiftSignup.findMany({
        where: {
          status: {
            not: ShiftSignupStatus.COMPLETED,
          },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: {
            include: {
              branch: { select: { name: true } },
              department: { select: { name: true } },
            },
          },
          slot: {
            include: {
              branch: { select: { name: true } },
              department: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.shiftSwapRequest.findMany({
        where: {
          createdAt: {
            gte: actualStartDate,
            lte: actualEndDate,
          },
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          requester: {
            include: {
              user: { select: { name: true } },
              branch: { select: { name: true } },
              department: { select: { name: true } },
            },
          },
          target: {
            include: {
              user: { select: { name: true } },
              branch: { select: { name: true } },
              department: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    // Calculate total hours
    const totalHours = shiftSignups.reduce(
      (sum, signup) => sum + signup.totalHours,
      0,
    );

    // Calculate shift utilization rate
    const shifts = await this.prisma.shiftSlot.findMany({
      where: shiftWhere,
      include: { signups: true },
    });
    const totalCapacity = shifts.reduce(
      (sum, shift) => sum + shift.capacity,
      0,
    );
    const totalSignups = shifts.reduce(
      (sum, shift) => sum + shift.signups.length,
      0,
    );
    const shiftUtilizationRate =
      totalCapacity > 0 ? (totalSignups / totalCapacity) * 100 : 0;

    // Calculate attendance rate
    const attendanceRate =
      totalEmployees > 0 ? (shiftSignups.length / totalEmployees) * 100 : 0;

    // Calculate average hours per employee
    const averageHoursPerEmployee =
      totalEmployees > 0 ? totalHours / totalEmployees : 0;

    // Get top performers
    const employeeMap = new Map<string, any>();
    shiftSignups.forEach((signup) => {
      const employeeId = signup.employeeId;
      if (!employeeMap.has(employeeId)) {
        employeeMap.set(employeeId, {
          employeeId: signup.employee.id,
          employeeName: signup.employee.name,
          branchName: signup.employee.branch.name,
          departmentName: signup.employee.department.name,
          totalShifts: 0,
          totalHours: 0,
        });
      }
      const employee = employeeMap.get(employeeId);
      employee.totalShifts += 1;
      employee.totalHours += signup.totalHours;
    });

    const topPerformers: TopPerformer[] = Array.from(employeeMap.values())
      .map((emp) => ({
        ...emp,
        averageHoursPerShift:
          emp.totalShifts > 0 ? emp.totalHours / emp.totalShifts : 0,
      }))
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 5);

    // Get shift trends (last 7 days)
    const shiftTrends: ShiftTrend[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const dayShifts = await this.prisma.shiftSlot.findMany({
        where: {
          ...shiftWhere,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: { signups: true },
      });

      const dayTotalShifts = dayShifts.length;
      const dayTotalHours = dayShifts.reduce(
        (sum, shift) =>
          sum + shift.signups.reduce((s, signup) => s + signup.totalHours, 0),
        0,
      );
      const dayCapacity = dayShifts.reduce(
        (sum, shift) => sum + shift.capacity,
        0,
      );
      const daySignups = dayShifts.reduce(
        (sum, shift) => sum + shift.signups.length,
        0,
      );
      const dayUtilizationRate =
        dayCapacity > 0 ? (daySignups / dayCapacity) * 100 : 0;

      shiftTrends.push({
        date: date.toISOString().split('T')[0],
        totalShifts: dayTotalShifts,
        totalHours: dayTotalHours,
        utilizationRate: dayUtilizationRate,
      });
    }

    // Get department performance
    const departmentMap = new Map<string, any>();
    shiftSignups.forEach((signup) => {
      const departmentId = signup.slot.departmentId;
      if (!departmentMap.has(departmentId)) {
        departmentMap.set(departmentId, {
          departmentId: signup.slot.departmentId,
          departmentName: signup.slot.department.name,
          branchName: signup.slot.branch.name,
          totalEmployees: new Set(),
          totalShifts: 0,
          totalHours: 0,
        });
      }
      const department = departmentMap.get(departmentId);
      department.totalEmployees.add(signup.employeeId);
      department.totalShifts += 1;
      department.totalHours += signup.totalHours;
    });

    const departmentPerformance: DepartmentPerformance[] = Array.from(
      departmentMap.values(),
    ).map((dept) => ({
      departmentId: dept.departmentId,
      departmentName: dept.departmentName,
      branchName: dept.branchName,
      totalEmployees: dept.totalEmployees.size,
      totalShifts: dept.totalShifts,
      totalHours: dept.totalHours,
      averageHoursPerEmployee:
        dept.totalEmployees.size > 0
          ? dept.totalHours / dept.totalEmployees.size
          : 0,
      utilizationRate:
        dept.totalShifts > 0 ? (dept.totalHours / dept.totalShifts) * 100 : 0,
    }));

    // Get recent activities
    const recentActivities: RecentActivity[] = [
      ...recentSignups.map((signup) => ({
        id: signup.id,
        type: 'shift_signup',
        description:
          signup.status === ShiftSignupStatus.PENDING
            ? `${signup.employee.name} Đã đăng ký ca làm việc`
            : `${signup.employee.name} Đã hủy đăng ký ca làm việc`,
        date: signup.createdAt,
        employeeName: signup.employee.name,
        branchName: signup.employee.branch.name,
        departmentName: signup.employee.department.name,
      })),
      ...recentSwaps.map((swap) => ({
        id: swap.id,
        type: 'shift_swap',
        description: `${swap.requester.user.name} đã yêu cầu hoán đổi ca làm việc với ${swap.target.user.name}`,
        date: swap.createdAt,
        employeeName: swap.requester.user.name,
        branchName: swap.requester.branch.name,
        departmentName: swap.requester.department.name,
      })),
    ]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);

    const stats: DashboardStats = {
      totalEmployees,
      totalBranches,
      totalDepartments,
      totalShifts,
      totalHours,
      averageHoursPerEmployee,
      shiftUtilizationRate,
      attendanceRate,
    };

    return {
      stats,
      recentActivities,
      topPerformers,
      shiftTrends,
      departmentPerformance,
      generatedAt: new Date(),
    };
  }
}
