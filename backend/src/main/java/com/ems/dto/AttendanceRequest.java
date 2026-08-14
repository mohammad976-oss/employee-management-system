package com.ems.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AttendanceRequest {
    @NotNull
    private Long employeeId;

    @NotNull
    private LocalDate attendanceDate;

    @NotNull
    private String status; // PRESENT, ABSENT, HALF_DAY, LEAVE, HOLIDAY

    private Double hoursWorked = 0.0;

    private Double overtimeHours = 0.0;

    private String remarks;
}
