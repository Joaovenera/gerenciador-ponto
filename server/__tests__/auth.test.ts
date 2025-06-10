import { hashPassword, comparePasswords } from '../auth';

describe('Auth Module', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'securepassword123';
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(password.length);
    });
  });
  
  describe('comparePasswords', () => {
    it('should return true for matching passwords', async () => {
      const password = 'securepassword123';
      const hashedPassword = await hashPassword(password);
      
      const result = await comparePasswords(password, hashedPassword);
      expect(result).toBe(true);
    });
    
    it('should return false for non-matching passwords', async () => {
      const password = 'securepassword123';
      const wrongPassword = 'wrongpassword123';
      const hashedPassword = await hashPassword(password);
      
      const result = await comparePasswords(wrongPassword, hashedPassword);
      expect(result).toBe(false);
    });
  });
});
