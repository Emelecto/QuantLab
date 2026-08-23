from engine import walkforward_splits, deflated_sharpe, integrity_label


def test_walkforward_splits_min_folds():
    splits = walkforward_splits(n_folds=5, total=1000)
    assert len(splits) >= 3


def test_walkforward_no_overlap():
    splits = walkforward_splits(n_folds=5, total=1000)
    for train, test in splits:
        assert set(train).isdisjoint(set(test))
        assert len(train) > 0 and len(test) > 0


def test_walkforward_train_before_test():
    splits = walkforward_splits(n_folds=5, total=1000)
    for train, test in splits:
        assert max(train) < min(test)


def test_deflated_sharpe_penalizes_multiple_tests():
    base = 1.5
    assert deflated_sharpe(base, n_tests=1) == base
    assert deflated_sharpe(base, n_tests=100) < base


def test_integrity_label():
    assert integrity_label(1.0, 0.8) == "Alta"
    assert integrity_label(1.0, 0.5) == "Media"
    assert integrity_label(1.0, 0.1) == "Baja"
