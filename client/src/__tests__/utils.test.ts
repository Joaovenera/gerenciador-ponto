import { 
  formatDate, 
  formatTime, 
  truncateText, 
  getStatusColor, 
  getTypeIcon 
} from '@/lib/utils';

describe('Utils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2023-05-15T12:30:00');
      const formatted = formatDate(date);
      expect(formatted).toBe('15/05/2023');
    });
    
    it('should handle date strings', () => {
      const dateStr = '2023-05-15T12:30:00';
      const formatted = formatDate(dateStr);
      expect(formatted).toBe('15/05/2023');
    });
  });

  describe('formatTime', () => {
    it('should format time correctly', () => {
      const date = new Date('2023-05-15T14:30:00');
      const formatted = formatTime(date);
      expect(formatted).toBe('14:30');
    });
  });

  describe('truncateText', () => {
    it('should truncate text longer than maxLength', () => {
      const text = 'This is a long text that should be truncated';
      const truncated = truncateText(text, 10);
      expect(truncated).toBe('This is a...');
      expect(truncated.length).toBeLessThan(text.length);
    });

    it('should not truncate text shorter than maxLength', () => {
      const text = 'Short';
      const truncated = truncateText(text, 10);
      expect(truncated).toBe('Short');
      expect(truncated.length).toBe(text.length);
    });
  });

  describe('getStatusColor', () => {
    it('should return correct color for active status', () => {
      const color = getStatusColor('active');
      expect(color).toBeTruthy();
    });

    it('should return correct color for inactive status', () => {
      const color = getStatusColor('inactive');
      expect(color).toBeTruthy();
    });
  });

  describe('getTypeIcon', () => {
    it('should return icon for in type', () => {
      const icon = getTypeIcon('in');
      expect(icon).toBeTruthy();
    });

    it('should return icon for out type', () => {
      const icon = getTypeIcon('out');
      expect(icon).toBeTruthy();
    });
  });
});
