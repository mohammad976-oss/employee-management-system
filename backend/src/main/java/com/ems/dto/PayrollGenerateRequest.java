package com.ems.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PayrollGenerateRequest {
    @NotNull
    private Long employeeId;

    @NotNull
    @Min(1) @Max(12)
    private Integer payMonth;

    @NotNull
    private Integer payYear;

    // Optional overrides
    private BigDecimal otherDeduction = BigDecimal.ZERO;

    // Flat tax rate applied to gross salary, e.g. 0.10 for 10%. Defaults applied in service if null.
    private BigDecimal taxRate;
}
