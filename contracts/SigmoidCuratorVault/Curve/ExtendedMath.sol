//SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.9;

/// @dev ^2, ^3, and sqrt functions
/// Solidity 0.8+ should catch any overflows on multiplications
library ExtendedMath {
    /**
     * @return The given number raised to the power of 2
     */
    function pow2(int256 a) internal pure returns (int256) {
        return a * a;
    }

    function pow3(int256 a) internal pure returns (int256) {
        return a * a * a;
    }

    /**
     * @return z The square root of the given positive number
     */
    function sqrt(int256 y) internal pure returns (int256 z) {
        require(y >= 0, "Negative sqrt");
        if (y > 3) {
            z = y;
            int256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
