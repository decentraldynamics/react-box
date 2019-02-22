pragma solidity ^0.5.0;

contract SimpleStorage {
    uint stored_uint;

    event StorageUpdated(uint new_value, uint old_value);

    function setInt(uint number) public {
        uint old_uint = stored_uint;
        stored_uint = number;
        emit StorageUpdated(stored_uint, old_uint);
    }

    function getInt() public view returns (uint) {
        return stored_uint;
    }
}
