#!/usr/bin/env node

function printHeader() {
  console.log(colors.cyan + colors.bold);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║         INOPAY SOVEREIGNTY AUDIT - PRE-BUILD CHECK           ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  Minimum Score Required: ' + String(MIN_SCORE).padEnd(3) + '/100                           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
}

function checkViteConfig() {
  const checks = {
    terserMinification: false,
    randomChunks: false,
    noSourcemaps: false,
    conditionalTagger: false,
  };
  
  try {
    const viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
    
    // Vérifier minification Terser
    if (viteConfig.includes("minify: 'terser'") || viteConfig.includes('minify: "terser"')) {
      checks.terserMinification = true;
    }
    
    // Vérifier chunks aléatoires
    if (viteConfig.includes('Math.random()') || viteConfig.includes('crypto.randomUUID')) {
      checks.randomChunks = true;
    }
    
    // Vérifier sourcemaps désactivées en prod
    if (viteConfig.includes('sourcemap: false') || viteConfig.includes("mode === 'production' ? false")) {
      checks.noSourcemaps = true;
    }
    
    // Vérifier que lovable-tagger est conditionnel
    if (viteConfig.includes('mode !== "production"') || viteConfig.includes("mode !== 'production'")) {
      checks.conditionalTagger = true;
    }
  } catch (err) {
    console.log(colors.yellow + '⚠ Could not read vite.config.ts' + colors.reset);
  }
  
  return checks;
}

/**
 * Calcule le score de souveraineté
 */
function calculateScore(issues, buildChecks) {
  let score = 100;
  
  // -10 par issue critique
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  score -= criticalCount * 10;
  
  // -2 par warning
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  score -= warningCount * 2;
  
  // -5 si pas de minification Terser
  if (!buildChecks.terserMinification) score -= 5;
  
  // -5 si pas de chunks aléatoires
  if (!buildChecks.randomChunks) score -= 5;
  
  // -5 si sourcemaps en prod
  if (!buildChecks.noSourcemaps) score -= 5;
  
  // -3 si tagger non conditionnel
  if (!buildChecks.conditionalTagger) score -= 3;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Affiche le rapport final
 */
function printReport(issues, buildChecks, score, filesScanned) {
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  
  console.log('\n' + colors.blue + '📊 SCAN RESULTS' + colors.reset);
  console.log('─'.repeat(60));
  console.log(`Files scanned: ${filesScanned}`);
  console.log(`Critical issues: ${colors.red}${criticalCount}${colors.reset}`);
  console.log(`Warnings: ${colors.yellow}${warningCount}${colors.reset}`);
  
  console.log('\n' + colors.blue + '🔧 BUILD CONFIGURATION' + colors.reset);
  console.log('─'.repeat(60));
  console.log(`Terser minification: ${buildChecks.terserMinification ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  console.log(`Random chunk names: ${buildChecks.randomChunks ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  console.log(`Sourcemaps disabled: ${buildChecks.noSourcemaps ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  console.log(`Conditional tagger: ${buildChecks.conditionalTagger ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  
  if (issues.length > 0 && VERBOSE) {
    console.log('\n' + colors.blue + '📋 ISSUES FOUND' + colors.reset);
    console.log('─'.repeat(60));
    issues.forEach(issue => {
      const color = issue.severity === 'critical' ? colors.red : colors.yellow;
      console.log(`${color}[${issue.severity.toUpperCase()}]${colors.reset} ${issue.file}:${issue.line}`);
      console.log(`  Pattern: ${issue.pattern}`);
      console.log(`  Content: ${issue.content}`);
    });
  } else if (issues.length > 0) {
    console.log(`\n${colors.yellow}Run with --verbose to see all issues${colors.reset}`);
  }
  
  console.log('\n' + colors.bold);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  
  const scoreColor = score >= 95 ? colors.green : score >= 80 ? colors.yellow : colors.red;
  console.log(`║  SOVEREIGNTY SCORE: ${scoreColor}${String(score).padEnd(3)}${colors.reset}${colors.bold}/100                              ║`);
  
  if (score >= MIN_SCORE) {
    console.log(`║  ${colors.green}✓ BUILD AUTHORIZED${colors.reset}${colors.bold}                                        ║`);
  } else {
    console.log(`║  ${colors.red}✗ BUILD BLOCKED (minimum: ${MIN_SCORE})${colors.reset}${colors.bold}                          ║`);
  }
  
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
}

/**
 * Fonction principale
 */
function main() {
  printHeader();
  
  console.log(colors.blue + '🔍 Scanning project files...' + colors.reset);
  
  // Scanner tous les fichiers
  const files = getAllFiles('.');
  let allIssues = [];
  
  files.forEach(file => {
    const issues = scanFile(file);
    allIssues.push(...issues);
  });
  
  // Vérifier package.json
  const packageIssues = checkPackageJson();
  allIssues.push(...packageIssues);
  
  // Vérifier config Vite
  const buildChecks = checkViteConfig();
  
  // Filtrer les faux positifs (fichiers de config/doc qui mentionnent les patterns)
  allIssues = allIssues.filter(issue => {
    // Ignorer les mentions dans les commentaires de documentation
    if (issue.content.includes('// Contient') || issue.content.includes('/* Documentation')) {
      return false;
    }
    // Ignorer les patterns dans les arrays de détection (les files de nettoyage eux-mêmes)
    if (issue.content.includes('pattern:') || issue.content.includes("severity:")) {
      return false;
    }
    return true;
  });
  
  // Calculer le score
  const score = calculateScore(allIssues, buildChecks);
  
  // Afficher le rapport
  printReport(allIssues, buildChecks, score, files.length);
  
  // Retourner le code de sortie approprié
  if (score >= MIN_SCORE) {
    console.log(colors.green + '✅ Sovereignty audit passed. Proceeding with build...\n' + colors.reset);
    process.exit(0);
  } else {
    console.log(colors.red + `❌ Sovereignty audit failed. Score ${score} is below minimum ${MIN_SCORE}.\n` + colors.reset);
    console.log('Fix the issues above or run with --min-score=<value> to adjust threshold.');
    process.exit(1);
  }
}

// Exécuter
main();
