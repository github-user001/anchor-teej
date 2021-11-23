use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke, system_instruction};

declare_id!("7aCUbFSGhaXtdAsZzmZKFhaHk3KJmCHrPUASc5mL4iHx");

#[program]
mod basic_1 {
    use super::*;

    pub fn initialize(
        ctx: Context<NewList>,
        capacity: u16,
        list_bump: u8,
        mint_hash: Pubkey,
        token_wallet: Pubkey,
        config: u16,
        information_state: u8,
    ) -> ProgramResult {
        let cost = 1_000_000_000;
        let user = &mut ctx.accounts.user;
        if user.lamports() < cost {
            return Err(ErrorCode::NotEnoughSOL.into());
        }

        invoke(
            &system_instruction::transfer(
                &ctx.accounts.user.key,
                ctx.accounts.slab_treasury.key,
                cost,
            ),
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.slab_treasury.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        let list = &mut ctx.accounts.order_list;
        list.list_owner = *ctx.accounts.user.to_account_info().key;
        list.bump = list_bump;
        list.capacity = capacity;

        // if list.orders.len() >= list.capacity as usize {
        //     return Err(ErrorCode::ListFull.into());
        // }

        let order = &mut ctx.accounts.order;

        list.orders.push(*order.to_account_info().key);
        order.mint_hash = mint_hash;
        order.token_wallet = token_wallet;
        // order. shopify_cart_id =
        /* This represents the options the user choose and will be encoded to represent which options chosen */
        order.config = config;
        /* what stage this order is in */
        order.information_state = information_state;

        Ok(())
    }

    pub fn update(ctx: Context<Update>, data: u64) -> ProgramResult {
        let my_account = &mut ctx.accounts.my_account;
        my_account.data = data;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(capacity: u16, list_bump: u8)]
pub struct NewList<'info> {
    #[account(init,
        payer=user,
        space=OrderList::space(capacity),
        seeds=[
            b"orderlist",
            user.to_account_info().key.as_ref(),
        ],
        bump=list_bump)]
    pub order_list: Account<'info, OrderList>,

    #[account(init, payer=user, space=Order::space())]
    pub order: Account<'info, Order>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut, address = Pubkey::try_from("asd").unwrap())]
    pub slab_treasury: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct OrderList {
    pub list_owner: Pubkey,
    pub bump: u8,
    pub capacity: u16,
    pub orders: Vec<Pubkey>,
}

#[account]
pub struct Order {
    pub mint_hash: Pubkey,
    pub token_wallet: Pubkey,
    // pub shopify_cart_id: String
    /* This represents the options the user choose and will be encoded to represent which options chosen */
    pub config: u16,
    /* what stage this order is in */
    pub information_state: u8,
}

impl Order {
    fn space() -> usize {
        // discriminator + creator pubkey + tokenwallet +config +informationstate
        8 + 32 + 32 + 32 + 2 + 1
    }
}

impl OrderList {
    fn space(capacity: u16) -> usize {
        // discriminator + owner pubkey + bump + capacity
        8 + 32 + 1 + 2 +
            // vec of item pubkeys
            4 + (capacity as usize) * std::mem::size_of::<Pubkey>()
    }
}

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut)]
    pub my_account: Account<'info, MyAccount>,
}

#[account]
pub struct MyAccount {
    pub data: u64,
    pub token_wallet: Pubkey,
    pub mint_hash: Pubkey,
}

#[error]
pub enum ErrorCode {
    #[msg("Not enough SOL. A slab costs 1 SOL.")]
    NotEnoughSOL,
    #[msg("This list is full")]
    ListFull,
}
