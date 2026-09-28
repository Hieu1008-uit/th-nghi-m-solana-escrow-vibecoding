use anchor_lang::prelude::*;

#[error_code]
pub enum EscrowError {
    #[msg("Invalid amount specified")]
    InvalidAmount,
    #[msg("Calculation overflow")]
    CalculationOverflow,
}
