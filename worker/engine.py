from typing import List, Tuple


def walkforward_splits(n_folds: int, train_pct: float = 0.7, total: int = 1000) -> List[Tuple[range, range]]:
    """Walk-forward splits: non-overlapping (train, test) blocks, train before test.

    Used to produce honest out-of-sample (OOS) metrics and avoid overfitting.
    """
    if n_folds < 2:
        raise ValueError("n_folds must be >= 2")
    if not (0 < train_pct < 1):
        raise ValueError("train_pct must be in (0, 1)")

    test_pct = 1.0 - train_pct
    block = total // n_folds
    if block < 10:
        raise ValueError("total too small for the requested folds")
    train_len = int(block * train_pct)
    test_len = block - train_len

    splits: List[Tuple[range, range]] = []
    start = 0
    for _ in range(n_folds):
        train = range(start, start + train_len)
        test = range(start + train_len, start + train_len + test_len)
        splits.append((train, test))
        start += train_len + test_len
    return splits


def deflated_sharpe(sharpe: float, n_tests: int = 1) -> float:
    """Bailey & López de Prado deflated Sharpe ratio (simplified)."""
    if n_tests <= 1:
        return sharpe
    return sharpe - (2.0 * (n_tests - 1) / (n_tests + 1)) ** 0.5


def integrity_label(sharpe_is: float, sharpe_oos: float) -> str:
    if sharpe_is == 0:
        return "Baja"
    ratio = sharpe_oos / abs(sharpe_is)
    if ratio >= 0.7:
        return "Alta"
    if ratio >= 0.4:
        return "Media"
    return "Baja"
