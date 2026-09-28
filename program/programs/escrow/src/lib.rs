use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("Escrow11111111111111111111111111111111111111");

#[program]
pub mod escrow {
    use super::*;

    pub fn make(
        ctx: Context<Make>,
        seed: u64,
        deposit_amount: u64,
        receive_amount: u64,
    ) -> Result<()> {
        ctx.accounts.init_escrow(seed, receive_amount, ctx.bumps.escrow)?;
        ctx.accounts.deposit(deposit_amount)
    }

    pub fn take(ctx: Context<Take>) -> Result<()> {
        ctx.accounts.deposit_to_maker()?;
        ctx.accounts.withdraw_and_close_vault()
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        ctx.accounts.refund_and_close_vault()
    }
}
