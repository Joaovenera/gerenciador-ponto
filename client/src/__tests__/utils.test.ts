import { formatDate, formatTime, truncateText, getStatusColor, getTypeIcon } from '../lib/utils';

describe('Utility functions', () => {
  describe('formatDate', () => {
    it('should format a date string correctly with default format', () => {
      const date = new Date('2023-05-15T12:00:00');
      const formattedDate = formatDate(date);
      
      expect(formattedDate).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should format a date string with custom format', () => {
      const date = new Date('2023-05-15T12:00:00');
      const formattedDate = formatDate(date, 'yyyy-MM-dd');
      
      expect(formattedDate).toBe('2023-05-15');
    });
  });

  describe('formatTime', () => {
    it('should format a time string correctly', () => {
      const date = new Date('2023-05-15T14:30:00');
      const formattedTime = formatTime(date);
      
      // Check for format HH:mm or H:mm depending on locale
      expect(formattedTime).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe('truncateText', () => {
    it('should truncate text that exceeds the max length', () => {
      const text = 'This is a long text that should be truncated';
      const truncated = truncateText(text, 10);
      
      expect(truncated.length).toBeLessThanOrEqual(13); // 10 + 3 for ellipsis
      expect(truncated).toContain('...');
    });

    it('should not truncate text that is shorter than max length', () => {
      const text = 'Short text';
      const truncated = truncateText(text, 20);
      
      expect(truncated).toBe(text);
      expect(truncated).not.toContain('...');
    });
  });

  describe('getStatusColor', () => {
    it('should return correct color for active status', () => {
      const color = getStatusColor('active');
      expect(color).toBe('green');
    });

    it('should return correct color for inactive status', () => {
      const color = getStatusColor('inactive');
      expect(color).toBe('gray');
    });
  });

  describe('getTypeIcon', () => {
    it('should return correct icon for in type', () => {
      const icon = getTypeIcon('in');
      expect(icon).toBe('log-in');
    });

    it('should return correct icon for out type', () => {
      const icon = getTypeIcon('out');
      expect(icon).toBe('log-out');
    });
  });
});
