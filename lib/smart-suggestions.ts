export interface LineItemSuggestion {
  description: string;
  rate: number;
  frequency: number;
  lastUsed: string;
}

export interface ClientSuggestion {
  id: string;
  name: string;
  email: string;
  company?: string;
  address: string;
  gstNumber?: string;
  currency: string;
  confidence: number;
}

export class SmartSuggestionsService {
  // AI-powered line item suggestions based on previous entries
  static generateLineItemSuggestions(
    userInvoices: any[],
    query: string,
    limit: number = 5
  ): LineItemSuggestion[] {
    if (!query || query.length < 2) return [];

    // Extract all line items from user's invoices
    const allItems = userInvoices.flatMap(invoice => 
      (invoice.items || []).map((item: any) => ({
        description: item.description,
        rate: item.rate,
        invoiceDate: invoice.date
      }))
    );

    // Group similar items and calculate frequency
    const itemGroups = new Map<string, {
      rates: number[];
      dates: string[];
      frequency: number;
    }>();

    allItems.forEach(item => {
      const key = item.description.toLowerCase().trim();
      if (!itemGroups.has(key)) {
        itemGroups.set(key, { rates: [], dates: [], frequency: 0 });
      }
      const group = itemGroups.get(key)!;
      group.rates.push(item.rate);
      group.dates.push(item.invoiceDate);
      group.frequency++;
    });

    // Filter and score suggestions based on query
    const suggestions: LineItemSuggestion[] = [];
    const queryLower = query.toLowerCase();

    itemGroups.forEach((group, description) => {
      // Calculate relevance score
      let score = 0;
      
      // Exact match gets highest score
      if (description === queryLower) {
        score = 100;
      }
      // Starts with query
      else if (description.startsWith(queryLower)) {
        score = 80;
      }
      // Contains query
      else if (description.includes(queryLower)) {
        score = 60;
      }
      // Fuzzy match (simple word matching)
      else {
        const queryWords = queryLower.split(' ');
        const descWords = description.split(' ');
        const matchingWords = queryWords.filter(qw => 
          descWords.some(dw => dw.includes(qw) || qw.includes(dw))
        );
        if (matchingWords.length > 0) {
          score = (matchingWords.length / queryWords.length) * 40;
        }
      }

      if (score > 0) {
        // Calculate average rate
        const avgRate = group.rates.reduce((sum, rate) => sum + rate, 0) / group.rates.length;
        
        // Get most recent usage
        const mostRecentDate = group.dates.sort().reverse()[0];

        suggestions.push({
          description: this.capitalizeWords(description),
          rate: Math.round(avgRate * 100) / 100,
          frequency: group.frequency,
          lastUsed: mostRecentDate,
        });
      }
    });

    // Sort by relevance score and frequency
    return suggestions
      .sort((a, b) => {
        // Prioritize frequency and recency
        const aScore = a.frequency * 10 + (new Date(a.lastUsed).getTime() / 1000000000);
        const bScore = b.frequency * 10 + (new Date(b.lastUsed).getTime() / 1000000000);
        return bScore - aScore;
      })
      .slice(0, limit);
  }

  // Smart client suggestions with fuzzy matching
  static generateClientSuggestions(
    clients: any[],
    emailQuery: string
  ): ClientSuggestion | null {
    if (!emailQuery || emailQuery.length < 3) return null;

    const emailLower = emailQuery.toLowerCase().trim();
    
    // Try exact email match first
    let exactMatch = clients.find(client => 
      client.email.toLowerCase() === emailLower
    );

    if (exactMatch) {
      return {
        ...exactMatch,
        confidence: 100
      };
    }

    // Try partial email match
    const partialMatches = clients.filter(client => {
      const clientEmail = client.email.toLowerCase();
      return clientEmail.includes(emailLower) || emailLower.includes(clientEmail.split('@')[0]);
    });

    if (partialMatches.length > 0) {
      // Return the best match based on email similarity
      const bestMatch = partialMatches.reduce((best, current) => {
        const bestSimilarity = this.calculateEmailSimilarity(emailLower, best.email.toLowerCase());
        const currentSimilarity = this.calculateEmailSimilarity(emailLower, current.email.toLowerCase());
        return currentSimilarity > bestSimilarity ? current : best;
      });

      return {
        ...bestMatch,
        confidence: Math.round(this.calculateEmailSimilarity(emailLower, bestMatch.email.toLowerCase()) * 100)
      };
    }

    // Try domain-based matching for company emails
    if (emailQuery.includes('@')) {
      const domain = emailQuery.split('@')[1];
      if (domain) {
        const domainMatches = clients.filter(client => {
          const clientDomain = client.email.split('@')[1];
          return clientDomain && clientDomain.toLowerCase().includes(domain.toLowerCase());
        });

        if (domainMatches.length > 0) {
          return {
            ...domainMatches[0],
            confidence: 70
          };
        }
      }
    }

    return null;
  }

  // Enhanced auto-complete for client names
  static generateClientNameSuggestions(
    clients: any[],
    nameQuery: string,
    limit: number = 5
  ): ClientSuggestion[] {
    if (!nameQuery || nameQuery.length < 2) return [];

    const queryLower = nameQuery.toLowerCase().trim();
    const suggestions: ClientSuggestion[] = [];

    clients.forEach(client => {
      let score = 0;
      const nameLower = client.name.toLowerCase();
      const companyLower = (client.company || '').toLowerCase();

      // Name matching
      if (nameLower === queryLower) {
        score = 100;
      } else if (nameLower.startsWith(queryLower)) {
        score = 90;
      } else if (nameLower.includes(queryLower)) {
        score = 70;
      }

      // Company matching
      if (companyLower === queryLower) {
        score = Math.max(score, 95);
      } else if (companyLower.startsWith(queryLower)) {
        score = Math.max(score, 85);
      } else if (companyLower.includes(queryLower)) {
        score = Math.max(score, 65);
      }

      // Word-based fuzzy matching
      if (score === 0) {
        const queryWords = queryLower.split(' ');
        const nameWords = nameLower.split(' ');
        const companyWords = companyLower.split(' ');
        
        const nameMatches = queryWords.filter(qw => 
          nameWords.some((nw: string) => nw.includes(qw) || qw.includes(nw))
        );
        const companyMatches = queryWords.filter(qw => 
          companyWords.some((cw: string) => cw.includes(qw) || qw.includes(cw))
        );

        if (nameMatches.length > 0) {
          score = (nameMatches.length / queryWords.length) * 50;
        }
        if (companyMatches.length > 0) {
          score = Math.max(score, (companyMatches.length / queryWords.length) * 45);
        }
      }

      if (score > 0) {
        suggestions.push({
          ...client,
          confidence: Math.round(score)
        });
      }
    });

    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  // Smart invoice number generation with pattern recognition
  static generateSmartInvoiceNumber(userInvoices: any[], userId: string): string {
    if (userInvoices.length === 0) {
      // Default pattern for new users
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      return `INV-${year}${month}-0001`;
    }

    // Analyze existing patterns
    const patterns = userInvoices.map(inv => inv.invoiceNumber).filter(Boolean);
    const mostCommonPattern = this.detectInvoicePattern(patterns);

    if (mostCommonPattern) {
      return this.generateNextInvoiceNumber(mostCommonPattern, patterns);
    }

    // Fallback to default pattern
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = userInvoices.length + 1;
    return `INV-${year}${month}-${String(count).padStart(4, '0')}`;
  }

  // Detect common invoice numbering patterns
  private static detectInvoicePattern(invoiceNumbers: string[]): string | null {
    const patterns = new Map<string, number>();

    invoiceNumbers.forEach(number => {
      // Extract pattern by replacing numbers with placeholders
      const pattern = number.replace(/\d+/g, 'N');
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    });

    // Return most common pattern
    let mostCommon = '';
    let maxCount = 0;
    patterns.forEach((count, pattern) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = pattern;
      }
    });

    return mostCommon || null;
  }

  // Generate next invoice number based on pattern
  private static generateNextInvoiceNumber(pattern: string, existingNumbers: string[]): string {
    // Find the highest number in the pattern
    const numbersInPattern = existingNumbers
      .filter(num => num.replace(/\d+/g, 'N') === pattern)
      .map(num => {
        const matches = num.match(/\d+/g);
        return matches ? matches.map(Number) : [];
      })
      .filter(nums => nums.length > 0);

    if (numbersInPattern.length === 0) {
      return pattern.replace(/N/g, '1');
    }

    // Find the maximum number in the last position (usually the sequence number)
    const lastNumbers = numbersInPattern.map(nums => nums[nums.length - 1]);
    const maxNumber = Math.max(...lastNumbers);

    // Generate next number
    const nextNumber = maxNumber + 1;
    
    // Replace the last 'N' with the next number
    let result = pattern;
    const nPositions = (pattern.match(/N/g) || []).length;
    
    if (nPositions === 1) {
      result = pattern.replace('N', String(nextNumber));
    } else {
      // For multiple numbers, increment the last one
      const parts = pattern.split('N');
      const currentYear = new Date().getFullYear();
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
      
      // Smart replacement based on common patterns
      if (pattern.includes('N-N-N')) {
        result = pattern
          .replace(/N/, String(currentYear))
          .replace(/N/, currentMonth)
          .replace(/N/, String(nextNumber).padStart(4, '0'));
      } else {
        // Default: replace last N with incremented number
        const lastNIndex = pattern.lastIndexOf('N');
        result = pattern.substring(0, lastNIndex) + 
                String(nextNumber).padStart(4, '0') + 
                pattern.substring(lastNIndex + 1);
      }
    }

    return result;
  }

  // Calculate email similarity for fuzzy matching
  private static calculateEmailSimilarity(email1: string, email2: string): number {
    const longer = email1.length > email2.length ? email1 : email2;
    const shorter = email1.length > email2.length ? email2 : email1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  // Levenshtein distance for string similarity
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Capitalize words for better presentation
  private static capitalizeWords(str: string): string {
    return str.replace(/\b\w/g, char => char.toUpperCase());
  }
}