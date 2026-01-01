

// ============= TYPES =============

export type IssueSeverity = 'critical' | 'major' | 'minor';

export interface ScanIssue {
  id: string;
  file: string;
  line: number;
  column: number;
  pattern: string;
  matchedText: string;
  severity: IssueSeverity;
  category: string;
  suggestion: string;
  autoFixable: boolean;
}

export interface ScanResult {
  totalFiles: number;
  filesScanned: number;
  filesWithIssues: number;
  issues: ScanIssue[];
  summary: {
    critical: number;
    major: number;
    minor: number;
  };
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

// ============= PATTERN DEFINITIONS =============

interface PatternDefinition {
  id: string;
  pattern: RegExp;
  severity: IssueSeverity;
  category: string;
  description: string;
  suggestion: string;
  autoFixable: boolean;
}

const LOVABLE_PATTERNS: PatternDefinition[] = [
  // === CRITICAL: Core [PLATFORM] APIs ===
  {
    id: 'lovable-generate',
    pattern: /[PLATFORM]\.generate\s*\(/g,
    severity: 'critical',
    category: '[PLATFORM] API',
    description: '[PLATFORM] AI generation call',
    suggestion: 'Replace with UnifiedLLM.complete() from src/lib/unifiedLLM.ts',
    autoFixable: true
  },
  {
    id: '[PLATFORM]-api',
    pattern: /lovableApi\s*[\.\(]/g,
    severity: 'critical',
    category: '[PLATFORM] API',
    description: '[PLATFORM] API usage',
    suggestion: 'Replace with sovereign API adapter',
    autoFixable: true
  },
  {
    id: 'get-ai-assistant',
    pattern: /getAIAssistant\s*\(/g,
    severity: 'critical',
    category: 'AI Assistant',
    description: '[PLATFORM] AI Assistant initialization',
    suggestion: 'Replace with UnifiedLLM instance',
    autoFixable: true
  },
  {
    id: 'run-assistant',
    pattern: /runAssistant\s*\(/g,
    severity: 'critical',
    category: 'AI Assistant',
    description: '[PLATFORM] Assistant execution',
    suggestion: 'Replace with UnifiedLLM.chat() method',
    autoFixable: true
  },
  
  // === CRITICAL: Agent imports ===
  {
    id: 'agent-import',
    pattern: /from\s+['"]@agent\/[^'"]+['"]/g,
    severity: 'critical',
    category: 'Agent Import',
    description: '[PLATFORM] Agent module import',
    suggestion: 'Remove agent import and implement with local logic',
    autoFixable: false
  },
  {
    id: 'agent-require',
    pattern: /require\s*\(\s*['"]@agent\/[^'"]+['"]\s*\)/g,
    severity: 'critical',
    category: 'Agent Import',
    description: '[PLATFORM] Agent require statement',
    suggestion: 'Remove agent require and implement with local logic',
    autoFixable: false
  },
  
  // === MAJOR: Event & Pattern schemas ===
  {
    id: 'event-schema',
    pattern: /EventSchema\s*[\.\[]/g,
    severity: 'major',
    category: 'Schema',
    description: '[PLATFORM] EventSchema usage',
    suggestion: 'Replace with custom Zod schema or TypeScript interface',
    autoFixable: true
  },
  {
    id: 'pattern-usage',
    pattern: /Pattern\.\w+/g,
    severity: 'major',
    category: 'Pattern',
    description: '[PLATFORM] Pattern.* usage',
    suggestion: 'Replace with custom regex patterns from clientProprietaryPatterns.ts',
    autoFixable: true
  },
  
  // === MAJOR: [PLATFORM] imports ===
  {
    id: 'lovable-import',
    pattern: /from\s+['"]@lovable\/[^'"]+['"]/g,
    severity: 'major',
    category: 'Import',
    description: '[PLATFORM] package import',
    suggestion: 'Remove or replace with open-source alternative',
    autoFixable: true
  },
  {
    id: '[PLATFORM]-tagger',
    pattern: /import\s*{\s*componentTagger\s*}\s*from\s*['"]lovable-tagger['"]/g,
    severity: 'major',
    category: 'Import',
    description: '[PLATFORM] tagger import (debug tool)',
    suggestion: 'Remove import - not needed in production',
    autoFixable: true
  },
  {
    id: '[PLATFORM]-import',
    pattern: /from\s+['"]@gptengineer\/[^'"]+['"]/g,
    severity: 'major',
    category: 'Import',
    description: 'GPT Engineer package import',
    suggestion: 'Remove or replace with open-source alternative',
    autoFixable: true
  },
  
  // === MAJOR: Supabase integrations (auto-generated) ===
  {
    id: 'supabase-integration-import',
    pattern: /from\s+['"]@\/integrations\/supabase\/[^'"]+['"]/g,
    severity: 'major',
    category: 'Supabase',
    description: 'Auto-generated Supabase integration import',
    suggestion: 'Replace with direct @supabase/supabase-js import',
    autoFixable: true
  },
  {
    id: 'supabase-relative-import',
    pattern: /from\s+['"]\.+\/integrations\/supabase\/[^'"]+['"]/g,
    severity: 'major',
    category: 'Supabase',
    description: 'Relative Supabase integration import',
    suggestion: 'Replace with direct @supabase/supabase-js import',
    autoFixable: true
  },
  
  // === MINOR: Comments and markers ===
  {
    id: '[PLATFORM]-comment',
    pattern: /\/\/\s*@lovable[^\n]*/g,
    severity: 'minor',
    category: 'Comment',
    description: '[PLATFORM] annotation comment',
    suggestion: 'Remove comment',
    autoFixable: true
  },
  {
    id: 'generated-by-[PLATFORM]',
    pattern: /\/\/\s*Generated by Lovable[^\n]*/gi,
    severity: 'minor',
    category: 'Comment',
    description: '[PLATFORM] generation comment',
    suggestion: 'Remove comment',
    autoFixable: true
  },
  {
    id: '[PLATFORM]-comment',
    pattern: /\/\/\s*@gptengineer[^\n]*/g,
    severity: 'minor',
    category: 'Comment',
    description: 'GPT Engineer annotation comment',
    suggestion: 'Remove comment',
    autoFixable: true
  },
  
  // === MINOR: Data attributes ===
  {
    id: ']*"/g,
    severity: 'minor',
    category: 'Attribute',
    description: '[PLATFORM] data attribute',
    suggestion: 'Remove data attribute',
    autoFixable: true
  },
  {
    id: ']*"/g,
    severity: 'minor',
    category: 'Attribute',
    description: '[PLATFORM] ID attribute',
    suggestion: 'Remove data attribute',
    autoFixable: true
  },
  
  // === MINOR: Telemetry ===
  {
    id: '[PLATFORM]-telemetry-fetch',
    pattern: /fetch\s*\(\s*['"][^'"]*lovable[^'"]*['"]/gi,
    severity: 'major',
    category: 'Telemetry',
    description: '[PLATFORM] telemetry fetch call',
    suggestion: 'Remove telemetry call',
    autoFixable: true
  },
  {
    id: '[PLATFORM]-beacon',
    pattern: /navigator\.sendBeacon\s*\([^)]*lovable[^)]*\)/gi,
    severity: 'major',
    category: 'Telemetry',
    description: '[PLATFORM] telemetry beacon',
    suggestion: 'Remove beacon call',
    autoFixable: true
  },
  
  // === CRITICAL: Environment variables ===
  {
    id: '[PLATFORM]-env-var',
    pattern: /VITE_LOVABLE_[A-Z_]+/g,
    severity: 'major',
    category: 'Environment',
    description: '[PLATFORM] environment variable',
    suggestion: 'Replace with generic environment variable',
    autoFixable: true
  },
  
  // === CRITICAL: WebSocket connections ===
  {
    id: '[PLATFORM]-websocket',
    pattern: /new\s+WebSocket\s*\([^)]*lovable[^)]*\)/gi,
    severity: 'critical',
    category: 'WebSocket',
    description: '[PLATFORM] WebSocket connection',
    suggestion: 'Remove or replace with self-hosted WebSocket server',
    autoFixable: false
  },
  
  // === CRITICAL: Service workers ===
  {
    id: '[PLATFORM]-service-worker',
    pattern: /navigator\.serviceWorker\.register\s*\([^)]*lovable[^)]*\)/gi,
    severity: 'critical',
    category: 'Service Worker',
    description: '[PLATFORM] service worker registration',
    suggestion: 'Replace with custom service worker',
    autoFixable: false
  }
];

// ============= DEPENDENCY PATTERNS =============

const LOVABLE_DEPENDENCIES: string[] = [
  '[PLATFORM]-tagger',
  '@[PLATFORM]/core',
  '@[PLATFORM]/ui',
  '@[PLATFORM]/runtime',
  '@[PLATFORM]/sdk',
  '@[PLATFORM]/core',
  '@[PLATFORM]/ui',
  '[PLATFORM]-core',
  'gpt-engineer',
  '[PLATFORM]-core'
];

// ============= SCANNER CLASS =============

export class LovablePatternScanner {
  private patterns: PatternDefinition[];
  private dependencies: string[];
  
  constructor() {
    this.patterns = LOVABLE_PATTERNS;
    this.dependencies = LOVABLE_DEPENDENCIES;
  }
  
  
  scanFile(filePath: string, content: string): ScanIssue[] {
    const issues: ScanIssue[] = [];
    const lines = content.split('\n');
    
    for (const patternDef of this.patterns) {
      // Reset regex lastIndex for each file
      patternDef.pattern.lastIndex = 0;
      
      let match: RegExpExecArray | null;
      while ((match = patternDef.pattern.exec(content)) !== null) {
        // Calculate line and column from match index
        const { line, column } = this.getLineAndColumn(content, match.index);
        
        issues.push({
          id: `${patternDef.id}-${filePath}-${line}`,
          file: filePath,
          line,
          column,
          pattern: patternDef.id,
          matchedText: match[0],
          severity: patternDef.severity,
          category: patternDef.category,
          suggestion: patternDef.suggestion,
          autoFixable: patternDef.autoFixable
        });
      }
    }
    
    return issues;
  }
  
  
  scanPackageJson(content: string): ScanIssue[] {
    const issues: ScanIssue[] = [];
    
    try {
      const pkg = JSON.parse(content);
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
        ...pkg.peerDependencies
      };
      
      for (const dep of this.dependencies) {
        if (allDeps[dep]) {
          issues.push({
            id: `dep-${dep}`,
            file: 'package.json',
            line: this.findLineInJson(content, dep),
            column: 1,
            pattern: '[PLATFORM]-dependency',
            matchedText: `"${dep}": "${allDeps[dep]}"`,
            severity: 'major',
            category: 'Dependency',
            suggestion: `Remove "${dep}" from dependencies`,
            autoFixable: true
          });
        }
      }
    } catch {
      // Invalid JSON, skip
    }
    
    return issues;
  }
  
  
export function formatReport(result: ScanResult): string {
  const lines: string[] = [
    '═══════════════════════════════════════════════════════════',
    '           INOPAY [PLATFORM] PATTERN SCANNER REPORT           ',
    '═══════════════════════════════════════════════════════════',
    '',
    `📊 Score: ${result.score}/100 (Grade: ${result.grade})`,
    '',
    `📁 Files scanned: ${result.filesScanned}/${result.totalFiles}`,
    `⚠️  Files with issues: ${result.filesWithIssues}`,
    '',
    '───────────────────────────────────────────────────────────',
    '                       SUMMARY                             ',
    '───────────────────────────────────────────────────────────',
    `🔴 Critical: ${result.summary.critical}`,
    `🟠 Major:    ${result.summary.major}`,
    `🟡 Minor:    ${result.summary.minor}`,
    ''
  ];
  
  if (result.issues.length > 0) {
    lines.push('───────────────────────────────────────────────────────────');
    lines.push('                       ISSUES                              ');
    lines.push('───────────────────────────────────────────────────────────');
    lines.push('');
    
    // Group by severity
    const groupedIssues = {
      critical: result.issues.filter(i => i.severity === 'critical'),
      major: result.issues.filter(i => i.severity === 'major'),
      minor: result.issues.filter(i => i.severity === 'minor')
    };
    
    for (const [severity, issues] of Object.entries(groupedIssues)) {
      if (issues.length === 0) continue;
      
      const icon = severity === 'critical' ? '🔴' : severity === 'major' ? '🟠' : '🟡';
      lines.push(`${icon} ${severity.toUpperCase()} (${issues.length})`);
      lines.push('');
      
      for (const issue of issues) {
        lines.push(`  📄 ${issue.file}:${issue.line}:${issue.column}`);
        lines.push(`     Pattern: ${issue.pattern}`);
        lines.push(`     Match: "${issue.matchedText.substring(0, 50)}${issue.matchedText.length > 50 ? '...' : ''}"`);
        lines.push(`     💡 ${issue.suggestion}`);
        lines.push(`     ${issue.autoFixable ? '✅ Auto-fixable' : '⚠️ Manual fix required'}`);
        lines.push('');
      }
    }
  } else {
    lines.push('✅ No [PLATFORM] patterns detected! Project is sovereign.');
  }
  
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('              Report generated by Inopay Liberator          ');
  lines.push('═══════════════════════════════════════════════════════════');
  
  return lines.join('\n');
}

/**
 * Export issues as JSON for programmatic use
 */
export function exportAsJson(result: ScanResult): string {
  return JSON.stringify(result, null, 2);
}

// Default export
export default LovablePatternScanner;
