/// Compute the StableSwap D invariant using Newton's method.
/// A · n^n · Σxi + D = A · D · n^n + D^(n+1) / (n^n · Πxi)
pub fn compute_d(xs: &[i128], a: u128, n: u32) -> i128 {
    let n_i128 = n as i128;
    let sum: i128 = xs.iter().sum();
    if sum == 0 {
        return 0;
    }

    // ann = A * n^n
    let n_pow_n: u128 = (n as u128).pow(n);
    let ann: i128 = (a * n_pow_n) as i128;

    let mut d = sum;

    for _ in 0..256 {
        // d_p = D^(n+1) / (n^n * Πxi)
        let mut d_p = d;
        for &xi in xs {
            d_p = d_p
                .checked_mul(d)
                .unwrap_or(i128::MAX)
                .checked_div(n_i128 * xi)
                .unwrap_or(1);
        }

        let d_prev = d;
        // D = (ann * sum + n * d_p) * D / ((ann - 1) * D + (n + 1) * d_p)
        let numerator = (ann * sum + n_i128 * d_p) * d;
        let denominator = (ann - 1) * d + (n_i128 + 1) * d_p;
        if denominator == 0 {
            break;
        }
        d = numerator / denominator;

        if (d - d_prev).abs() <= 1 {
            break;
        }
    }
    d
}

/// Compute new balance of token j after swapping dx of token i in.
/// Uses the StableSwap invariant to find y such that D is conserved.
pub fn compute_y(xs: &[i128], a: u128, d: i128, i: u32, j: u32) -> i128 {
    let n = xs.len() as u32;
    let n_i128 = n as i128;
    let n_pow_n: u128 = (n as u128).pow(n);
    let ann: i128 = (a * n_pow_n) as i128;

    // c = D^(n+1) / (n^n * Πxk for k != j)
    let mut c = d;
    let mut sum = 0i128;

    for (k, &xk) in xs.iter().enumerate() {
        if k as u32 == j {
            continue;
        }
        let _ = i; // xs[i] already updated by caller
        sum += xk;
        c = c
            .checked_mul(d)
            .unwrap_or(i128::MAX)
            .checked_div(n_i128 * xk)
            .unwrap_or(1);
    }
    c = c.checked_mul(d).unwrap_or(i128::MAX).checked_div(ann * n_i128).unwrap_or(1);

    let b = sum + d / ann;

    let mut y = d;
    for _ in 0..256 {
        let y_prev = y;
        // y = (y^2 + c) / (2y + b - D)
        let numerator = y * y + c;
        let denominator = 2 * y + b - d;
        if denominator == 0 {
            break;
        }
        y = numerator / denominator;
        if (y - y_prev).abs() <= 1 {
            break;
        }
    }
    y
}
