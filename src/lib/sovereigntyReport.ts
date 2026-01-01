
export function checkFileForProprietaryCode(content: string): {
  isClean: boolean;
  issues: { pattern: string; line: number; severity: 'critical' | 'warning' }[];
} {
  const issues: { pattern: string; line: number; severity: 'critical' | 'warning' }[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    for (const { pattern, severity, name } of PROPRIETARY_PATTERNS) {
      // Reset regex lastIndex
      pattern.lastIndex = 0;
      if (pattern.test(lines[i])) {
        issues.push({
          pattern: name,
          line: i + 1,
          severity,
        });
      }
    }
  }

  return {
    isClean: issues.length === 0,
    issues,
  };
}

export function auditProjectFiles(files: Map<string, string>): {
  report: SovereigntyAuditResult;
  fileIssues: Map<string, { pattern: string; line: number; severity: 'critical' | 'warning' }[]>;
} {
  const fileIssues = new Map<string, { pattern: string; line: number; severity: 'critical' | 'warning' }[]>();
  
  files.forEach((content, filePath) => {
    // Ne scanner que les fichiers source
    if (!/\.(ts|tsx|js|jsx|json)$/.test(filePath)) return;
    if (filePath.includes('node_modules')) return;
    
    const result = checkFileForProprietaryCode(content);
    if (!result.isClean) {
      fileIssues.set(filePath, result.issues);
    }
  });
  
  // Utiliser la nouvelle version unifiée
  const report = generateSovereigntyReport(files);
  
  return { report, fileIssues };
}

/**
 * Générer un résumé texte du rapport
 */
export function generateReportSummary(report: SovereigntyAuditResult): string {
  return `
╔══════════════════════════════════════════════════════════════╗
║           INOPAY SOVEREIGNTY AUDIT REPORT                    ║
╠══════════════════════════════════════════════════════════════╣
║ Date: ${report.auditDate.split('T')[0]}                                        ║
║ Mode: ${report.buildMode.toUpperCase().padEnd(12)} | Infra: ${report.infrastructureMode.toUpperCase().padEnd(12)}║
╠══════════════════════════════════════════════════════════════╣
║ SCORE: ${String(report.certification.score).padEnd(3)}/100                                           ║
║ ${report.certification.message.padEnd(60)}║
╠══════════════════════════════════════════════════════════════╣
║ RÉSUMÉ:                                                      ║
║ • Fichiers scannés: ${String(report.summary.totalFilesScanned).padEnd(5)}                              ║
║ • Problèmes critiques: ${String(report.summary.issuesCritical).padEnd(3)}                             ║
║ • Avertissements: ${String(report.summary.issuesWarning).padEnd(3)}                                  ║
║ • Signatures DOM nettoyées: ${String(report.domStatus.signaturesRemoved).padEnd(3)}                      ║
╠══════════════════════════════════════════════════════════════╣
║ CONFIGURATION BUILD:                                         ║
║ • Minification: ${report.buildConfig.minification.padEnd(10)} ✓                         ║
║ • Source Maps: ${report.buildConfig.sourceMaps ? 'ACTIVÉS  ⚠' : 'DÉSACTIVÉS ✓'}                           ║
║ • Chunks aléatoires: ${report.buildConfig.chunkRandomization ? 'OUI ✓' : 'NON ⚠'}                         ║
║ • Console strip: ${report.buildConfig.consoleStripping ? 'OUI ✓' : 'NON ⚠'}                              ║
╠══════════════════════════════════════════════════════════════╣
║ PROTECTION SECRETS:                                          ║
║ • Session storage only: ${report.secretsProtection.sessionStorageOnly ? 'OUI ✓' : 'NON ⚠'}                    ║
║ • Mode incognito: ${report.secretsProtection.incognitoModeAvailable ? 'DISPONIBLE ✓' : 'INDISPONIBLE ⚠'}                  ║
║ • Pas de DB persist: ${report.secretsProtection.noDatabasePersistence ? 'OUI ✓' : 'NON ⚠'}                      ║
╚══════════════════════════════════════════════════════════════╝

© ${new Date().getFullYear()} Inovaq Canada Inc. - Code Souverain
`.trim();
}
