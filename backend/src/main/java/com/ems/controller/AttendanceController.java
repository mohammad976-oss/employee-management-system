package com.ems.controller;

import com.ems.dto.AttendanceRequest;
import com.ems.entity.Attendance;
import com.ems.service.AttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @GetMapping
    public List<Attendance> getAll(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        if (employeeId != null && month != null && year != null) {
            return attendanceService.getByEmployeeAndMonth(employeeId, month, year);
        }
        if (employeeId != null) {
            return attendanceService.getByEmployee(employeeId);
        }
        if (date != null) {
            return attendanceService.getByDate(date);
        }
        return attendanceService.getAll();
    }

    // Marks (or updates) attendance for one employee on one day
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Attendance markAttendance(@Valid @RequestBody AttendanceRequest request) {
        return attendanceService.markAttendance(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        attendanceService.delete(id);
    }
}
