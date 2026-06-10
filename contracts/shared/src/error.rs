use soroban_sdk::contracterror;

#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Error {
    InsufficientLiquidity = 1,
    InvalidFee = 2,
    SlippageExceeded = 3,
    DeadlineExpired = 4,
    InvalidPath = 5,
    Overflow = 6,
    ZeroLiquidity = 7,
    Unauthorized = 8,
    InvalidInput = 9,
    InsufficientOutput = 10,
    PoolAlreadyExists = 11,
    AlreadyInitialized = 12,
}
