const hre = require('hardhat');
const { ethers } = hre;
const { parseUnits } = ethers;
const { ParaSwap } = require('paraswap');
let paraSwap;

let initParaswap = (networkId) => {
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
        SELL,
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
 * @param {String} receiver Address of the receiver
 */
async function buildSwap(
    srcTokenObj,
    destTokenObj,
    srcAmount,
    minAmount,
    priceRoute,
    userAddress,
    receiver = userAddress,
) {
    // Decimals can be added as an argument if necessary
    const transactionRequestOrError = await paraSwap.buildTx(
        srcToken.address,
        destToken.address,
        srcAmount,
        minAmount,
        priceRoute,
        userAddress,
        undefined, // Partner is undefined (not required)
        undefined, // Partner address is not required
        undefined, // Partner fee bps is not required
        receiver
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
        const minAmount = (srcAmountBigNumber.mul(ethers.BigNumber.from(1 - slippage / 100))).toString();
        
        paraSwap = initParaswap(networkId);
        
        const priceRoute = await fetchRate(
            srcToken,
            destToken,
            srcAmount,
            userAddress
        );


        const transactionRequest = await buildSwap({
            srcToken,
            destToken,
            srcAmount,
            minAmount,
            priceRoute,
            userAddress,
            ...rest
        });

        console.log("TransactionRequest: ", transactionRequest);

        return transactionRequest;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function main() {
    


}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
