// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.4;
pragma abicoder v2;

interface IParaSwapAugustus {
    function getTokenTransferProxy() external view returns (address);
}
