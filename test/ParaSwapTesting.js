const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const { parseUnits } = require("@ethersproject/units");
const { provider } = waffle;
const {
  initParaswap,
  fetchRate,
  buildSwap,
  getSwapTransaction
} = require("../scripts/Paraswap-Swap");
const {
  getBigNumber,
  getTimeStamp,
  getTimeStampNow,
  getDate,
  getSeconds,
  increaseTime,
  setNextBlockTimestamp,
  impersonateAccounts
} = require("../helpers/helpers");

const USDC = {
  address: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
  decimals: 6
}
const MKR = {
  address: "0x6f7C932e7684666C9fd1d44527765433e01fF61d",
  decimals: 18
}
const WETH = {
  address: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
  decimals: 18
}

const USDCWhaleAddr = "0x947d711c25220d8301c087b25ba111fe8cbf6672";
const AugustusRegistry = "0xca35a4866747Ff7A604EF7a2A7F246bb870f3ca1";
const TokenTransferProxy = "0x216b4b4ba9f3e719726886d34a177484278bfcae";

describe("Paraswap Contract", function () {
  let admin;
  let paraSwapContract;
  let USDCContract, MKRContract, WETHContract;
  let USDCWhale;

  before("Should return the new greeting once it's changed", async () => {
    [admin] = provider.getWallets();
    [USDCWhale] = await impersonateAccounts([USDCWhaleAddr]);
    USDCContract = await ethers.getContractAt("IERC20", USDC.address);
    MKRContract = await ethers.getContractAt("IERC20", MKR.address);
    WETHContract = await ethers.getContractAt("IERC20", WETH.address);

    initParaswap(137, ethers);
    const ParaSwapSeller = await ethers.getContractFactory("ParaSwapSellAdapter");
    paraSwapContract = await ParaSwapSeller.deploy(AugustusRegistry);
    await paraSwapContract.deployed();
  });

  it("Should be able to swap without using contracts", async () => {
    await USDCContract.connect(USDCWhale).approve(TokenTransferProxy, parseUnits("1000", USDC.decimals));
    console.log("Allowance: ", (await USDCContract.allowance(USDCWhaleAddr, TokenTransferProxy)).toString());

    transaction = await getSwapTransaction(
      USDC,
      WETH,
      parseUnits("100", USDC.decimals),
      137,
      2,
      USDCWhaleAddr
    );

    WETHBalanceBefore = await WETHContract.balanceOf(USDCWhale.address);
    USDCBalanceBefore = await USDCContract.balanceOf(USDCWhale.address);

    await USDCWhale.sendTransaction({
      to: transaction.to,
      data: transaction.data
    });

    WETHBalanceAfter = await WETHContract.balanceOf(USDCWhale.address);
    USDCBalanceAfter = await USDCContract.balanceOf(USDCWhale.address);

    console.log("Change in USDC balance: ", (USDCBalanceBefore.sub(USDCBalanceAfter)).toString());
    console.log("Change in WETH balance: ", (WETHBalanceAfter.sub(WETHBalanceBefore)).toString());
  });
});
