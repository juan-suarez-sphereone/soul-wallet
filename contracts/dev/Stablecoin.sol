// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 < 0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract Stablecoin is Ownable, ERC20 {

    constructor() public ERC20("Fakeusdc", "FUSDC") {
        _mint(msg.sender, 10000);
        _mint(0xfEd4B12d1c759436a9885A4Bd0A16B4B0F30ba81,2000);
        _mint(0xb51eF995Ee82B30001F682f4325fBF0C38981327,2000);
        _mint(0xdC457839AbE50082722B09b1B1F30dd617668772,2000);
        _mint(0xB156Ebe47aC4A7d40cF6f43BaFea242fC2fEE6b3,2000);
    }

    function decimals() public view virtual override returns (uint8) {
        return 2;
    }

    function mintTokens (address reciver, uint256 _qty) public onlyOwner {
        _mint(reciver, _qty);
    }

    function burnTokens (address account, uint256 _qty) public onlyOwner {
        _burn (account, _qty);
    }
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        _transfer(from, to, amount);
        return true;
    }
}
