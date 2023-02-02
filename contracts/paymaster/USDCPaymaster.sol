// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../EntryPoint.sol";
import "../BasePaymaster.sol";
import "./BaseTokenPaymaster.sol";
import "../interfaces/UserOperation.sol";

contract USDCPaymaster is BaseTokenPaymaster {
    using UserOperationLib for UserOperation;

    //calculated cost of the postOp
    

    /**
     * @notice for security reason, the price feed is immutable
     */
    

    constructor(
        EntryPoint _entryPoint,
        
        address _owner
    ) BaseTokenPaymaster(_entryPoint, _owner) {
       
    }

   
}
