#![no_std]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, BytesN, Env,
    String,
};

const INSTANCE_BUMP_LEDGERS: u32 = 30 * 17_280;
const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_LEDGERS - 17_280;
const RECORD_BUMP_LEDGERS: u32 = 90 * 17_280;
const RECORD_LIFETIME_THRESHOLD: u32 = RECORD_BUMP_LEDGERS - 17_280;

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct UserRecord {
    pub account: Address,
    pub active: bool,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct PaymentReceipt {
    pub sender: Address,
    pub recipient: Address,
    pub amount: i128,
    pub memo: String,
    pub ledger: u32,
}

#[derive(Clone)]
#[contracttype]
enum DataKey {
    Admin,
    Username(String),
    Receipt(BytesN<32>),
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[contracterror]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    UsernameTaken = 3,
    UsernameNotFound = 4,
    ReceiptExists = 5,
    ReceiptNotFound = 6,
    InvalidAmount = 7,
}

#[contract]
pub struct PaymentRegistryContract;

#[contractevent(data_format = "single-value")]
pub struct PaymentRegistryInitialized {
    pub admin: Address,
}

#[contractevent(data_format = "map")]
pub struct UsernameRegistered {
    pub username: String,
    pub account: Address,
}

#[contractevent(data_format = "single-value")]
pub struct PaymentRecorded {
    pub payment_id: BytesN<32>,
}

#[contractimpl]
impl PaymentRegistryContract {
    pub fn initialize(e: Env, admin: Address) -> Result<(), Error> {
        if e.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        e.storage().instance().set(&DataKey::Admin, &admin);
        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_LEDGERS);
        PaymentRegistryInitialized { admin }.publish(&e);
        Ok(())
    }

    pub fn register_username(e: Env, username: String, account: Address) -> Result<(), Error> {
        account.require_auth();
        let key = DataKey::Username(username.clone());
        if e.storage().persistent().has(&key) {
            return Err(Error::UsernameTaken);
        }
        e.storage().persistent().set(
            &key,
            &UserRecord {
                account: account.clone(),
                active: true,
            },
        );
        e.storage()
            .persistent()
            .extend_ttl(&key, RECORD_LIFETIME_THRESHOLD, RECORD_BUMP_LEDGERS);
        UsernameRegistered { username, account }.publish(&e);
        Ok(())
    }

    pub fn resolve(e: Env, username: String) -> Result<UserRecord, Error> {
        e.storage()
            .persistent()
            .get(&DataKey::Username(username))
            .ok_or(Error::UsernameNotFound)
    }

    pub fn record_payment(
        e: Env,
        payment_id: BytesN<32>,
        sender: Address,
        recipient: Address,
        amount: i128,
        memo: String,
    ) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        sender.require_auth();
        let key = DataKey::Receipt(payment_id.clone());
        if e.storage().persistent().has(&key) {
            return Err(Error::ReceiptExists);
        }
        e.storage().persistent().set(
            &key,
            &PaymentReceipt {
                sender,
                recipient,
                amount,
                memo,
                ledger: e.ledger().sequence(),
            },
        );
        e.storage()
            .persistent()
            .extend_ttl(&key, RECORD_LIFETIME_THRESHOLD, RECORD_BUMP_LEDGERS);
        PaymentRecorded { payment_id }.publish(&e);
        Ok(())
    }

    pub fn get_receipt(e: Env, payment_id: BytesN<32>) -> Result<PaymentReceipt, Error> {
        e.storage()
            .persistent()
            .get(&DataKey::Receipt(payment_id))
            .ok_or(Error::ReceiptNotFound)
    }
}

#[cfg(test)]
mod test {
    extern crate std;

    use super::{Error, PaymentRegistryContract, PaymentRegistryContractClient};
    use soroban_sdk::{testutils::Address as _, Address, BytesN, Env, String};

    fn id(e: &Env, value: u8) -> BytesN<32> {
        BytesN::from_array(e, &[value; 32])
    }

    fn setup<'a>(e: &'a Env) -> (PaymentRegistryContractClient<'a>, Address, Address, Address) {
        let admin = Address::generate(e);
        let sender = Address::generate(e);
        let recipient = Address::generate(e);
        let contract_id = e.register(PaymentRegistryContract, ());
        let client = PaymentRegistryContractClient::new(e, &contract_id);
        e.mock_all_auths();
        client.initialize(&admin);
        (client, admin, sender, recipient)
    }

    #[test]
    fn username_registration_and_payment_receipt_work() {
        let e = Env::default();
        let (client, _admin, sender, recipient) = setup(&e);
        client.register_username(&String::from_str(&e, "alice"), &recipient);
        assert_eq!(
            client.resolve(&String::from_str(&e, "alice")).account,
            recipient
        );
        client.record_payment(
            &id(&e, 1),
            &sender,
            &recipient,
            &100_000,
            &String::from_str(&e, "tip"),
        );
        assert_eq!(client.get_receipt(&id(&e, 1)).amount, 100_000);
    }

    #[test]
    fn duplicate_username_and_receipt_are_rejected() {
        let e = Env::default();
        let (client, _admin, sender, recipient) = setup(&e);
        client.register_username(&String::from_str(&e, "alice"), &recipient);
        assert_eq!(
            client.try_register_username(&String::from_str(&e, "alice"), &sender),
            Err(Ok(Error::UsernameTaken))
        );
        client.record_payment(
            &id(&e, 2),
            &sender,
            &recipient,
            &1,
            &String::from_str(&e, "x"),
        );
        assert_eq!(
            client.try_record_payment(
                &id(&e, 2),
                &sender,
                &recipient,
                &1,
                &String::from_str(&e, "x")
            ),
            Err(Ok(Error::ReceiptExists))
        );
    }
}
