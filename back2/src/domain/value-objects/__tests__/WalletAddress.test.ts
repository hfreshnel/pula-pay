import { WalletAddress } from '../WalletAddress';

describe('WalletAddress Value Object', () => {
  const validEvmAddress = '0x1234567890abcdef1234567890abcdef12345678';
  const validEvmAddressUppercase = '0x1234567890ABCDEF1234567890ABCDEF12345678';

  describe('create', () => {
    it('should create valid EVM address for POLYGON_AMOY', () => {
      const address = WalletAddress.create(validEvmAddress, 'POLYGON_AMOY');

      expect(address.address).toBe(validEvmAddress.toLowerCase());
      expect(address.blockchain).toBe('POLYGON_AMOY');
    });

    it('should create valid EVM address for ETH_SEPOLIA', () => {
      const address = WalletAddress.create(validEvmAddress, 'ETH_SEPOLIA');

      expect(address.blockchain).toBe('ETH_SEPOLIA');
    });

    it('should create valid EVM address for ARBITRUM_SEPOLIA', () => {
      const address = WalletAddress.create(validEvmAddress, 'ARBITRUM_SEPOLIA');

      expect(address.blockchain).toBe('ARBITRUM_SEPOLIA');
    });

    it('should create valid EVM address for POLYGON mainnet', () => {
      const address = WalletAddress.create(validEvmAddress, 'POLYGON');

      expect(address.blockchain).toBe('POLYGON');
    });

    it('should create valid EVM address for ETHEREUM mainnet', () => {
      const address = WalletAddress.create(validEvmAddress, 'ETHEREUM');

      expect(address.blockchain).toBe('ETHEREUM');
    });

    it('should create valid EVM address for ARBITRUM mainnet', () => {
      const address = WalletAddress.create(validEvmAddress, 'ARBITRUM');

      expect(address.blockchain).toBe('ARBITRUM');
    });

    it('should normalize address to lowercase', () => {
      const address = WalletAddress.create(validEvmAddressUppercase, 'POLYGON_AMOY');

      expect(address.address).toBe(validEvmAddressUppercase.toLowerCase());
    });

    it('should trim whitespace from address', () => {
      const address = WalletAddress.create(`  ${validEvmAddress}  `, 'POLYGON_AMOY');

      expect(address.address).toBe(validEvmAddress.toLowerCase());
    });

    it('should throw error for invalid EVM address - too short', () => {
      expect(() => WalletAddress.create('0x1234', 'POLYGON_AMOY')).toThrow(
        'Invalid wallet address'
      );
    });

    it('should throw error for invalid EVM address - too long', () => {
      expect(() =>
        WalletAddress.create(
          '0x1234567890abcdef1234567890abcdef123456789999',
          'POLYGON_AMOY'
        )
      ).toThrow('Invalid wallet address');
    });

    it('should throw error for invalid EVM address - missing 0x prefix', () => {
      expect(() =>
        WalletAddress.create('1234567890abcdef1234567890abcdef12345678', 'POLYGON_AMOY')
      ).toThrow('Invalid wallet address');
    });

    it('should throw error for invalid EVM address - invalid characters', () => {
      expect(() =>
        WalletAddress.create('0x1234567890ghijkl1234567890abcdef12345678', 'POLYGON_AMOY')
      ).toThrow('Invalid wallet address');
    });
  });

  describe('fromTrusted', () => {
    it('should create address without validation', () => {
      const address = WalletAddress.fromTrusted(validEvmAddress, 'POLYGON_AMOY');

      expect(address.address).toBe(validEvmAddress.toLowerCase());
      expect(address.blockchain).toBe('POLYGON_AMOY');
    });

    it('should normalize to lowercase', () => {
      const address = WalletAddress.fromTrusted(validEvmAddressUppercase, 'POLYGON_AMOY');

      expect(address.address).toBe(validEvmAddressUppercase.toLowerCase());
    });
  });

  describe('isValid static method', () => {
    it('should return true for valid EVM address', () => {
      expect(WalletAddress.isValid(validEvmAddress, 'POLYGON_AMOY')).toBe(true);
    });

    it('should return true for uppercase EVM address', () => {
      expect(WalletAddress.isValid(validEvmAddressUppercase, 'POLYGON_AMOY')).toBe(true);
    });

    it('should return false for invalid address', () => {
      expect(WalletAddress.isValid('invalid', 'POLYGON_AMOY')).toBe(false);
    });

    it('should return false for empty address', () => {
      expect(WalletAddress.isValid('', 'POLYGON_AMOY')).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should be frozen (immutable)', () => {
      const address = WalletAddress.create(validEvmAddress, 'POLYGON_AMOY');

      expect(() => {
        (address as any).address = '0xnewaddress';
      }).toThrow();
    });
  });

  describe('isTestnet', () => {
    it('should return true for POLYGON_AMOY', () => {
      const address = WalletAddress.create(validEvmAddress, 'POLYGON_AMOY');
      expect(address.isTestnet()).toBe(true);
    });

    it('should return true for ETH_SEPOLIA', () => {
      const address = WalletAddress.create(validEvmAddress, 'ETH_SEPOLIA');
      expect(address.isTestnet()).toBe(true);
    });

    it('should return true for ARBITRUM_SEPOLIA', () => {
      const address = WalletAddress.create(validEvmAddress, 'ARBITRUM_SEPOLIA');
      expect(address.isTestnet()).toBe(true);
    });

    it('should return false for POLYGON mainnet', () => {
      const address = WalletAddress.create(validEvmAddress, 'POLYGON');
      expect(address.isTestnet()).toBe(false);
    });

    it('should return false for ETHEREUM mainnet', () => {
      const address = WalletAddress.create(validEvmAddress, 'ETHEREUM');
      expect(address.isTestnet()).toBe(false);
    });

    it('should return false for ARBITRUM mainnet', () => {
      const address = WalletAddress.create(validEvmAddress, 'ARBITRUM');
      expect(address.isTestnet()).toBe(false);
    });
  });

  describe('abbreviated', () => {
    it('should return abbreviated address', () => {
      const address = WalletAddress.create(validEvmAddress, 'POLYGON_AMOY');

      const abbreviated = address.abbreviated();

      expect(abbreviated).toBe('0x1234...5678');
    });

    it('should return full address if length <= 10', () => {
      const shortAddress = WalletAddress.fromTrusted('0x12345678', 'POLYGON_AMOY');

      expect(shortAddress.abbreviated()).toBe('0x12345678');
    });
  });

  describe('explorerUrl', () => {
    it('should return correct explorer URL for POLYGON_AMOY', () => {
      const address = WalletAddress.create(validEvmAddress, 'POLYGON_AMOY');

      expect(address.explorerUrl()).toBe(
        `https://amoy.polygonscan.com/address/${validEvmAddress.toLowerCase()}`
      );
    });

    it('should return correct explorer URL for ETH_SEPOLIA', () => {
      const address = WalletAddress.create(validEvmAddress, 'ETH_SEPOLIA');

      expect(address.explorerUrl()).toBe(
        `https://sepolia.etherscan.io/address/${validEvmAddress.toLowerCase()}`
      );
    });

    it('should return correct explorer URL for ARBITRUM_SEPOLIA', () => {
      const address = WalletAddress.create(validEvmAddress, 'ARBITRUM_SEPOLIA');

      expect(address.explorerUrl()).toBe(
        `https://sepolia.arbiscan.io/address/${validEvmAddress.toLowerCase()}`
      );
    });

    it('should return correct explorer URL for POLYGON mainnet', () => {
      const address = WalletAddress.create(validEvmAddress, 'POLYGON');

      expect(address.explorerUrl()).toBe(
        `https://polygonscan.com/address/${validEvmAddress.toLowerCase()}`
      );
    });

    it('should return correct explorer URL for ETHEREUM mainnet', () => {
      const address = WalletAddress.create(validEvmAddress, 'ETHEREUM');

      expect(address.explorerUrl()).toBe(
        `https://etherscan.io/address/${validEvmAddress.toLowerCase()}`
      );
    });

    it('should return correct explorer URL for ARBITRUM mainnet', () => {
      const address = WalletAddress.create(validEvmAddress, 'ARBITRUM');

      expect(address.explorerUrl()).toBe(
        `https://arbiscan.io/address/${validEvmAddress.toLowerCase()}`
      );
    });
  });

  describe('equals', () => {
    it('should return true for same address and blockchain', () => {
      const addr1 = WalletAddress.create(validEvmAddress, 'POLYGON_AMOY');
      const addr2 = WalletAddress.create(validEvmAddress, 'POLYGON_AMOY');

      expect(addr1.equals(addr2)).toBe(true);
    });

    it('should return true regardless of case', () => {
      const addr1 = WalletAddress.create(validEvmAddress, 'POLYGON_AMOY');
      const addr2 = WalletAddress.create(validEvmAddressUppercase, 'POLYGON_AMOY');

      expect(addr1.equals(addr2)).toBe(true);
    });

    it('should return false for different addresses', () => {
      const addr1 = WalletAddress.create(validEvmAddress, 'POLYGON_AMOY');
      const addr2 = WalletAddress.create(
        '0xabcdef1234567890abcdef1234567890abcdef12',
        'POLYGON_AMOY'
      );

      expect(addr1.equals(addr2)).toBe(false);
    });

    it('should return false for same address but different blockchain', () => {
      const addr1 = WalletAddress.create(validEvmAddress, 'POLYGON_AMOY');
      const addr2 = WalletAddress.create(validEvmAddress, 'ETH_SEPOLIA');

      expect(addr1.equals(addr2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the address string', () => {
      const address = WalletAddress.create(validEvmAddress, 'POLYGON_AMOY');

      expect(address.toString()).toBe(validEvmAddress.toLowerCase());
    });
  });

  describe('serialization', () => {
    it('should convert to JSON', () => {
      const address = WalletAddress.create(validEvmAddress, 'POLYGON_AMOY');
      const json = address.toJSON();

      expect(json).toEqual({
        address: validEvmAddress.toLowerCase(),
        blockchain: 'POLYGON_AMOY',
      });
    });
  });
});
