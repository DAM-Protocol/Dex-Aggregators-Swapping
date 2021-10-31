// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.4;
pragma abicoder v2;

import {IParaSwapAugustus} from "./Interfaces/IParaSwapAugustus.sol";
import {IParaSwapAugustusRegistry} from "./Interfaces/IParaSwapAugustusRegistry.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title ParaSwapSellAdapter
 * @notice Implements the logic for selling tokens on ParaSwap
 * @dev Adapted from Aave contract at (https://github.com/aave/protocol-v2/blob/master/contracts/adapters/BaseParaSwapSellAdapter.sol)
 * @dev Convert the contract to an abstract contract after testing
 * @author rashtrakoff
 * 
 */
contract ParaSwapSellAdapter {
    using SafeERC20 for IERC20;

    IParaSwapAugustusRegistry public immutable AUGUSTUS_REGISTRY;

    constructor(IParaSwapAugustusRegistry augustusRegistry) {
        // Do something on Augustus registry to check the right contract was passed
        require(!augustusRegistry.isValidAugustus(address(0)));
        AUGUSTUS_REGISTRY = augustusRegistry;
    }

    /**
     * @dev Swaps a token for another using ParaSwap
     * @param _swapCalldata Calldata for ParaSwap's AugustusSwapper contract
     * @param _augustus Address of ParaSwap's AugustusSwapper contract
     * @param _assetToSwapFrom Address of the asset to be swapped from
     * @param _assetToSwapTo Address of the asset to be swapped to
     * @param _amountToSwap Amount to be swapped
     * @param _minAmountToReceive Minimum amount to be received from the swap
     * @return _amountReceived The amount received from the swap
     * Minimum amount to be received may be calculated on-chain too in order to
     * avoid malicious actors from swapping tokens for less value.
     */
    function sellOnParaSwap(
        bytes memory _swapCalldata,
        IParaSwapAugustus _augustus,
        IERC20 _assetToSwapFrom,
        IERC20 _assetToSwapTo,
        uint256 _amountToSwap,
        uint256 _minAmountToReceive
    ) public returns (uint256 _amountReceived) {
        require(
            AUGUSTUS_REGISTRY.isValidAugustus(address(_augustus)),
            "INVALID_AUGUSTUS"
        );

        uint256 _balanceBeforeAssetFrom = _assetToSwapFrom.balanceOf(
            address(this)
        );
        require(
            _balanceBeforeAssetFrom >= _amountToSwap,
            "INSUFFICIENT_BALANCE_BEFORE_SWAP"
        );
        uint256 _balanceBeforeAssetTo = _assetToSwapTo.balanceOf(address(this));

        address _tokenTransferProxy = _augustus.getTokenTransferProxy();
        _assetToSwapFrom.safeApprove(_tokenTransferProxy, 0);
        _assetToSwapFrom.safeApprove(_tokenTransferProxy, _amountToSwap);

        (bool _success, ) = address(_augustus).call(_swapCalldata);
        if (!_success) {
            // Copy revert reason from call
            assembly {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
        }

        require(
            _assetToSwapFrom.balanceOf(address(this)) ==
                _balanceBeforeAssetFrom - _amountToSwap,
            "WRONG_BALANCE_AFTER_SWAP"
        );
        _amountReceived =
            _assetToSwapTo.balanceOf(address(this)) -
            _balanceBeforeAssetTo;
        require(
            _amountReceived >= _minAmountToReceive,
            "INSUFFICIENT_AMOUNT_RECEIVED"
        );
    }
}
