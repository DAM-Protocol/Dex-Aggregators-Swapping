// ParaSwap API docs can be found at: https://app.swaggerhub.com/apis/paraswapv5/api/1.0
const hre = require('hardhat');
const { ParaSwap } = require('paraswap');
let paraSwap;

let initParaswap = (networkId, ethers) => {
    paraSwap = new ParaSwap(networkId).setWeb3Provider(ethers);
}

/**
 * Function to fetch price route for a swap.
 * A token object should contain at least the token address and the decimals.
 * @param {Object} srcTokenObj 
 * @param {Object} destTokenObj 
 * @param {String} srcAmount 
 * @param {String} userAddress
 */
async function fetchRate(
    srcTokenObj,
    destTokenObj,
    srcAmount,
    userAddress
) {
    const priceRouteOrError = await paraSwap.getRate(
        srcTokenObj.address,
        destTokenObj.address,
        srcAmount,
        userAddress,
        'SELL',
        srcTokenObj.decimals,
        destTokenObj.decimals
    );

    if ("message" in priceRouteOrError) {
        throw new Error(priceRouteOrError.message);
    }

    return priceRouteOrError;    
}

/**
 * Function to build a swap transaction
 * @param {Object} srcTokenObj Token to be sold
 * @param {Object} destTokenObj Token to be bought
 * @param {String} srcAmount Amount of srcToken to be sold
 * @param {String} minAmount Minimum amount expected after swap
 * @param {Object} priceRoute Price route that we got from fetchRate to follow 
 * @param {String} userAddress Address of the swapper/seller
 * @param {String} deadline Deadline for the transaction to take place (Unix timestamp format)
 */
async function buildSwap(
    srcTokenObj,
    destTokenObj,
    srcAmount,
    minAmount,
    priceRoute,
    userAddress
) {
    const transactionRequestOrError = await paraSwap.buildTx(
        srcTokenObj.address,
        destTokenObj.address,
        srcAmount,
        minAmount,
        priceRoute,
        userAddress,
        undefined, // Remove this line after testing
        undefined, // Remove this line after testing
        undefined, // Remove this line after testing
        userAddress, // Remove this line after testing
        {ignoreChecks: true} // Remove this line after testing
    );

    if ("message" in transactionRequestOrError) {
        throw new Error(transactionRequestOrError.message);
    }

    return transactionRequestOrError;
}

/**
 * 
 * @param {Object} srcTokenObj Token to be sold
 * @param {Object} destTokenObj Token to be bought
 * @param {BigNumber} srcAmountBigNumber Amount of srcToken to be sold
 * @param {int} networkId Chain id of the network
 * @param {int} slippage Slippage percentage
 * @param {String} userAddress Address of the user 
 * @param  {...any} rest 
 * @returns A transaction request object
 */
async function getSwapTransaction(
    srcTokenObj,
    destTokenObj,
    srcAmountBigNumber,
    networkId,
    slippage = 3,
    userAddress,
    ...rest // required ?
) {
    try {
        const srcAmount = srcAmountBigNumber.toString();
        const minAmount = (srcAmountBigNumber.mul(ethers.BigNumber.from(100 - slippage)).div(ethers.BigNumber.from(100))).toString();

        if (paraSwap === undefined)
            paraSwap = initParaswap(networkId);

        const priceRoute = await fetchRate(
            srcTokenObj,
            destTokenObj,
            srcAmount,
            userAddress
        );

        console.log("Price route: ", priceRoute);

        const transactionRequest = await buildSwap(
            srcTokenObj,
            destTokenObj,
            srcAmount,
            minAmount,
            priceRoute,
            userAddress,
            ...rest
        );

        return transactionRequest;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = {
    initParaswap,
    fetchRate,
    buildSwap,
    getSwapTransaction
};
