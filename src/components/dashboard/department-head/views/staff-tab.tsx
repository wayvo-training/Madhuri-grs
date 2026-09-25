import React from "react";

export function StaffTab(props: any) {
  return (

        <div className="space-y-6">
          {/* Team Capacity Metrics Banner */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Officers"
              value={staffList.length}
              icon={Users}
              accentColor="emerald"
              description={`${currentDepartmentName} department`}
            />
            <StatCard
              label="On Active Duty"
              value={activeStaffCount}
              icon={UserCheck}
              accentColor="slate"
              description={`${onLeaveStaffCount} officer(s) on approved leave`}
            />
            <StatCard
              label="Active Assigned Queue"
              value={`${totalActiveTickets} Tickets`}
              icon={Inbox}
              accentColor="slate"
              description={`Across ${activeStaffCount} active officers`}
            />
            <StatCard
              label="Department Load Factor"
              value={`${Math.round((totalActiveTickets / totalStaffCapacity) * 100
  );
}