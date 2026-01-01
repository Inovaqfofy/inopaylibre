import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Download,
  Github,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Package,
  RefreshCw,
  Sparkles,
  Shield,
  Server,
  Database,
  FileCode,
  FolderArchive,
  Rocket,
  ExternalLink,
  AlertTriangle,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Zap,
  List,
  ClipboardCheck,
  Image,
  Code,
  GitCompare,
  Lock,
  Unlock,
  FileSignature,
  TestTube,
  FileText,
  Network,
  Key,
  Hash,
  Award,
  Layers,
  Cloud,
  Settings,
  Plus,
  FolderGit,
  Info
} from "lucide-react";
import { SovereigntyAuditReport } from "./SovereigntyAuditReport";
import { FileDiffPreview, AssetDownloader, TypeScriptValidator } from "./liberation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { analyzeZipFile, analyzeFromGitHub, RealAnalysisResult } from "@/lib/zipAnalyzer";
import { validatePack, type PackValidationResult } from "@/lib/packValidator";
import {
  shouldRemoveFile,
  cleanPackageJson,
  cleanViteConfig,
  cleanIndexHtml,
  cleanStylesheet,
  cleanTsConfig,
  deepCleanSourceFile,
  checkProprietaryCDN,
  detectNeededPolyfills,
  calculateSovereigntyScore,
  finalVerificationPass,
  cleanEnvFile,
  cleanMarkdownFile,
  cleanShellScript,
  HOOK_POLYFILLS,
  PROPRIETARY_PATHS,
  getRequiredPolyfills,
  generatePolyfillFiles,
} from "@/lib/clientProprietaryPatterns";

// Configuration complète de libération
interface LiberationConfig {
  sourceToken: string;
  sourceUrl: string;
  destinationToken: string;
  destinationUsername: string;
  isPrivateRepo: boolean;
  createNewRepo: boolean;
  existingRepoName?: string;
}

interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  default_branch: string;
}

interface LiberationPackHubProps {
  initialConfig?: LiberationConfig | null;
}

// 6 étapes du flux unifié
type FlowStep = "setup" | "upload" | "analyzing" | "cleaning" | "verifying" | "ready";

interface CleanedFile {
  path: string;
  content: string;
  cleaned: boolean;
}

interface CleaningStats {
  filesRemoved: number;
  filesCleaned: number;
  filesVerified: number;
  packagesRemoved: number;
  polyfillsGenerated: number;
  suspiciousPatterns: string[];
  sovereigntyScore: number;
  criticalIssues: number;
  majorIssues: number;
  minorIssues: number;
}

}
                <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Github className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">GitHub Destination</h3>
                    {destValid && (
                      <Badge className="bg-primary/10 text-primary border-primary/30">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Validé
                      </Badge>
                    )}
                  </div>
                  
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Token et compte pour pousser le code nettoyé. 
                      Peut être différent du compte source.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label>Token GitHub destination (scope "repo")</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showDestToken ? 'text' : 'password'}
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                          value={config?.destinationToken || ''}
                          onChange={(e) => {
                            setConfig(prev => prev ? { ...prev, destinationToken: e.target.value } : null);
                            setDestValid(null);
                          }}
                          className={destValid === false ? 'border-destructive' : destValid === true ? 'border-primary' : ''}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowDestToken(!showDestToken)}
                        >
                          {showDestToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={handleValidateDestination}
                        disabled={isValidatingToken || !config?.destinationToken?.trim()}
                      >
                        {isValidatingToken ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Valider'}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Username/Organisation destination</Label>
                    <Input
                      placeholder="mon-compte-souverain"
                      value={config?.destinationUsername || ''}
                      onChange={(e) => setConfig(prev => prev ? { ...prev, destinationUsername: e.target.value } : null)}
                    />
                  </div>

                  {}
                    {config?.sourceToken && availableRepos.length > 0 && (
                      <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                          <List className="h-4 w-4" />
                          Vos dépôts GitHub
                        </Label>
                        <div className="flex gap-2">
                          <Select 
                            value={selectedRepo} 
                            onValueChange={setSelectedRepo}
                            disabled={loading}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Sélectionner un dépôt..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableRepos.map((repo) => (
                                <SelectItem key={repo.full_name} value={repo.full_name}>
                                  <div className="flex items-center gap-2">
                                    {repo.private ? (
                                      <Badge variant="outline" className="text-xs">Privé</Badge>
                                    ) : (
                                      <Badge variant="secondary" className="text-xs">Public</Badge>
                                    )}
                                    {repo.full_name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={handleGitHubImportFromRepo}
                            disabled={loading || !selectedRepo}
                          >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                          </Button>
                        </div>
                        {loadingRepos && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Chargement des dépôts...
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Divider if both options shown */}
                    {config?.sourceToken && availableRepos.length > 0 && (
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">ou</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Manual URL input - always available */}
                    <div className="space-y-2">
                      <Label>URL du dépôt</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://github.com/utilisateur/projet"
                          value={githubUrl}
                          onChange={(e) => setGithubUrl(e.target.value)}
                          className="flex-1"
                          disabled={loading}
                        />
                        <Button 
                          onClick={handleGitHubImport}
                          disabled={loading || !githubUrl.trim()}
                        >
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="zip" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    <div
                      {...getRootProps()}
                      className={`flex flex-col items-center justify-center py-16 px-8 cursor-pointer transition-all rounded-lg border-2 border-dashed ${
                        isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
                      }`}
                    >
                      <input {...getInputProps()} />
                      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl mb-6 ${
                        isDragActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        <Upload className="h-8 w-8" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        {isDragActive ? "Déposez le fichier ici" : "Glissez votre fichier ZIP"}
                      </h3>
                      <p className="text-muted-foreground text-center">
                        ou cliquez pour sélectionner
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Features Preview */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
                <CardContent className="pt-6">
                  <FileCode className="h-8 w-8 text-blue-500 mb-3" />
                  <h4 className="font-semibold mb-1">Frontend 100% propre</h4>
                  <p className="text-sm text-muted-foreground">
                    Nettoyage exhaustif + polyfills
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
                <CardContent className="pt-6">
                  <Server className="h-8 w-8 text-green-500 mb-3" />
                  <h4 className="font-semibold mb-1">Backend Express</h4>
                  <p className="text-sm text-muted-foreground">
                    Edge Functions → Express.js
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
                <CardContent className="pt-6">
                  <Database className="h-8 w-8 text-purple-500 mb-3" />
                  <h4 className="font-semibold mb-1">Base de données</h4>
                  <p className="text-sm text-muted-foreground">
                    Schéma SQL + migrations
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
                <CardContent className="pt-6">
                  <Zap className="h-8 w-8 text-orange-500 mb-3" />
                  <h4 className="font-semibold mb-1">Vérification finale</h4>
                  <p className="text-sm text-muted-foreground">
                    Score de souveraineté garanti
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Step: Analyzing/Cleaning/Verifying */}
        {(step === "analyzing" || step === "cleaning" || step === "verifying") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card>
              <CardContent className="py-16 text-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-6" />
                <h3 className="text-xl font-semibold mb-2">
                  {step === "analyzing" ? "Analyse en cours..." : 
                   step === "cleaning" ? "Nettoyage en profondeur..." :
                   "Vérification de souveraineté..."}
                </h3>
                <p className="text-muted-foreground mb-6">{progressMessage || "Veuillez patienter"}</p>
                <Progress value={progress} className="max-w-md mx-auto" />
                
                {step === "cleaning" && (
                  <div className="mt-6 max-w-md mx-auto text-left">
                    <p className="text-xs text-muted-foreground mb-2">Opérations en cours:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>✓ Suppression imports propriétaires</li>
                      <li>✓ Nettoyage télémétrie et tracking</li>
                      <li>✓ Remplacement IDs Supabase hardcodés</li>
                      <li>✓ Suppression clés API exposées</li>
                      <li>✓ Génération polyfills compatibilité</li>
                    </ul>
                  </div>
                )}
                
                {step === "verifying" && (
                  <div className="mt-6 max-w-md mx-auto">
                    <Alert>
                      <ShieldCheck className="h-4 w-4" />
                      <AlertDescription>
                        Vérification finale de souveraineté en cours...
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step: Ready */}
        {step === "ready" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Tabs for Pack Generation, Preview, Assets, Validation, NCS 2.0 and Audit */}
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="preview" className="gap-1 text-xs">
                  <GitCompare className="h-3 w-3" />
                  <span className="hidden sm:inline">Prévisualisation</span>
                </TabsTrigger>
                <TabsTrigger value="assets" className="gap-1 text-xs">
                  <Image className="h-3 w-3" />
                  <span className="hidden sm:inline">Assets</span>
                </TabsTrigger>
                <TabsTrigger value="validate" className="gap-1 text-xs">
                  <Code className="h-3 w-3" />
                  <span className="hidden sm:inline">Validation</span>
                </TabsTrigger>
                <TabsTrigger value="ncs2" className="gap-1 text-xs">
                  <Award className="h-3 w-3" />
                  <span className="hidden sm:inline">NCS 2.0</span>
                </TabsTrigger>
                <TabsTrigger value="pack" className="gap-1 text-xs">
                  <Package className="h-3 w-3" />
                  <span className="hidden sm:inline">Pack</span>
                </TabsTrigger>
                <TabsTrigger value="audit" className="gap-1 text-xs">
                  <ClipboardCheck className="h-3 w-3" />
                  <span className="hidden sm:inline">Audit</span>
                </TabsTrigger>
              </TabsList>

              {/* Preview Tab - File Diff */}
              <TabsContent value="preview" className="mt-4 space-y-4">
                <FileDiffPreview
                  originalFiles={extractedFiles}
                  cleanedFiles={cleanedFiles}
                  onUpdateFile={(path, content) => {
                    setCleanedFiles(prev => ({ ...prev, [path]: content }));
                  }}
                  onRevertFile={(path) => {
                    const original = extractedFiles.get(path);
                    if (original) {
                      setCleanedFiles(prev => ({ ...prev, [path]: original }));
                    }
                  }}
                />
              </TabsContent>

              {/* Assets Tab - Download external assets */}
              <TabsContent value="assets" className="mt-4 space-y-4">
                <AssetDownloader
                  files={cleanedFiles}
                  onAssetsReady={(assets) => {
                    setDownloadedAssets(assets);
                    toast.success(`${assets.size} assets traités`);
                  }}
                />
              </TabsContent>

              {/* Validation Tab - TypeScript check */}
              <TabsContent value="validate" className="mt-4 space-y-4">
                <TypeScriptValidator
                  files={cleanedFiles}
                  onValidationComplete={(isValid, errors) => {
                    setIsCodeValid(isValid);
                    if (!isValid) {
                      toast.warning(`${errors.filter(e => e.severity === 'error').length} erreurs détectées`);
                    }
                  }}
                />
              </TabsContent>

              {/* NCS 2.0 Tab - Detailed phases */}
              <TabsContent value="ncs2" className="mt-4 space-y-4">
                <Card className="border-2 border-amber-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-amber-500" />
                      NCS Version 2.0 - Les 10 Phases de Purification
                    </CardTitle>
                    <CardDescription>
                      La Grande Messe de Libération Numérique - Système de purification ultime
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Phase list with status */}
                    <div className="space-y-3">
                      {[
                        { phase: 1, icon: FileSignature, name: "Manifest Signé SHA-256", desc: "Sceau cryptographique de souveraineté avec traçabilité complète", status: "included" },
                        { phase: 2, icon: Cloud, name: "Multi-Deployment", desc: "Configs Fly.io, Render, Railway, Helm Charts, Ansible Playbooks", status: "included" },
                        { phase: 3, icon: Shield, name: "Audit OWASP Automatique", desc: "Détection SQL injection, XSS, CSRF, SSRF (A01-A09)", status: "included" },
                        { phase: 4, icon: TestTube, name: "Tests Automatiques", desc: "Tests unitaires, intégration et sécurité générés automatiquement", status: "included" },
                        { phase: 5, icon: FileText, name: "Rapport 10 Pages", desc: "Documentation complète avec failles, corrections et certification", status: "included" },
                        { phase: 6, icon: Lock, name: "Audit Sécurité Avancé", desc: "Détection backdoors, DNS suspects, credentials exposées", status: "included" },
                        { phase: 7, icon: Network, name: "Diagrammes Mermaid", desc: "Architecture, flux de données et schéma de déploiement", status: "included" },
                        { phase: 8, icon: Layers, name: "Clean Architecture", desc: "Restructuration Domain/Application/Infrastructure/UI", status: "optional" },
                        { phase: 9, icon: Key, name: "Coffre Secrets", desc: "Intégration Hashicorp Vault, Doppler, Infisical", status: "included" },
                        { phase: 10, icon: Hash, name: "Signature Cryptographique", desc: "CHECKSUM.sha256 pour garantir l'intégrité du pack", status: "included" }].map(({ phase, icon: Icon, name, desc, status }) => (
                        <div key={phase} className={`flex items-start gap-4 p-3 rounded-lg border ${status === 'included' ? 'bg-green-500/5 border-green-500/20' : 'bg-muted/50 border-muted'}`}>
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${status === 'included' ? 'bg-green-500/20' : 'bg-muted'}`}>
                            <Icon className={`h-4 w-4 ${status === 'included' ? 'text-green-500' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">Phase {phase}: {name}</span>
                              {status === 'included' ? (
                                <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/20">
                                  <CheckCircle2 className="h-2 w-2 mr-1" />
                                  Inclus
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px]">Optionnel</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Generated files summary */}
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mt-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <FolderArchive className="h-4 w-4 text-primary" />
                        Fichiers générés par NCS 2.0
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">📁 /deployment-configs</p>
                          <ul className="space-y-1 text-muted-foreground pl-4">
                            <li>fly.toml</li>
                            <li>render.yaml</li>
                            <li>railway.json</li>
                            <li>helm/ (values.yaml, Chart.yaml)</li>
                            <li>ansible/ (playbook.yml, inventory)</li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">📁 /reports</p>
                          <ul className="space-y-1 text-muted-foreground pl-4">
                            <li>owasp_compliance.json</li>
                            <li>security_audit_v2.json</li>
                            <li>project_graph.json</li>
                            <li>rewrite_log.json</li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">📁 /tests</p>
                          <ul className="space-y-1 text-muted-foreground pl-4">
                            <li>unit/ (components.test.ts)</li>
                            <li>integration/ (api.test.ts)</li>
                            <li>security/ (vulnerabilities.test.ts)</li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">📁 /secrets</p>
                          <ul className="space-y-1 text-muted-foreground pl-4">
                            <li>vault-policy.hcl</li>
                            <li>import-to-vault.sh</li>
                            <li>doppler.yaml</li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">📁 /docs</p>
                          <ul className="space-y-1 text-muted-foreground pl-4">
                            <li>ARCHITECTURE.md (Mermaid)</li>
                            <li>DATA_FLOW.md</li>
                            <li>DEPLOYMENT.md</li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">📄 Racine</p>
                          <ul className="space-y-1 text-muted-foreground pl-4">
                            <li>sovereignty_manifest.json</li>
                            <li>SOVEREIGNTY_BADGE.svg</li>
                            <li>LIBERATION_REPORT_FULL.html</li>
                            <li>CHECKSUM.sha256</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="audit" className="mt-4 space-y-4">
                {/* Pass cleaned files to audit */}
                <SovereigntyAuditReport 
                  files={new Map(Object.entries(cleanedFiles))} 
                />
              </TabsContent>

              <TabsContent value="pack" className="mt-4 space-y-6">
                {/* Sovereignty Score */}
                <Card className={`border-2 ${getScoreBorderColor(cleaningStats.sovereigntyScore)}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className={`h-5 w-5 ${getScoreColor(cleaningStats.sovereigntyScore)}`} />
                        Score de Souveraineté
                      </CardTitle>
                      <div className={`text-3xl font-bold ${getScoreColor(cleaningStats.sovereigntyScore)}`}>
                        {cleaningStats.sovereigntyScore}%
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress 
                      value={cleaningStats.sovereigntyScore} 
                      className="h-3 mb-3"
                    />
                    <p className="text-sm text-muted-foreground">
                      {cleaningStats.sovereigntyScore >= 95 
                        ? "✅ Excellent ! Votre code est 100% souverain et prêt à déployer."
                        : cleaningStats.sovereigntyScore >= 80
                        ? "⚠️ Bon score. Quelques éléments mineurs pourraient être améliorés."
                        : "❌ Des éléments propriétaires subsistent. Vérification manuelle recommandée."}
                    </p>
                    
                    {/* Issue breakdown */}
                    {(cleaningStats.criticalIssues > 0 || cleaningStats.majorIssues > 0 || cleaningStats.minorIssues > 0) && (
                      <div className="flex gap-4 mt-3">
                        {cleaningStats.criticalIssues > 0 && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {cleaningStats.criticalIssues} critique{cleaningStats.criticalIssues > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {cleaningStats.majorIssues > 0 && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-500 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {cleaningStats.majorIssues} majeur{cleaningStats.majorIssues > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {cleaningStats.minorIssues > 0 && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            {cleaningStats.minorIssues} mineur{cleaningStats.minorIssues > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  Projet "{projectName}" nettoyé
                </CardTitle>
                <CardDescription>
                  {analysisResult?.score || 0}% → {cleaningStats.sovereigntyScore}% de souveraineté
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div className="text-center p-3 bg-background rounded-lg border">
                    <div className="text-2xl font-bold">{frontendFilesCount}</div>
                    <div className="text-xs text-muted-foreground">Total fichiers</div>
                  </div>
                  <div className="text-center p-3 bg-success/10 rounded-lg border border-success/20">
                    <div className="text-2xl font-bold text-success">{cleaningStats.filesVerified}</div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Eye className="h-3 w-3" /> Vérifiés
                    </div>
                  </div>
                  <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="text-2xl font-bold text-primary">{cleaningStats.filesCleaned}</div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Shield className="h-3 w-3" /> Nettoyés
                    </div>
                  </div>
                  <div className="text-center p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                    <div className="text-2xl font-bold text-destructive">{cleaningStats.filesRemoved}</div>
                    <div className="text-xs text-muted-foreground">Supprimés</div>
                  </div>
                  <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <div className="text-2xl font-bold text-blue-500">{cleaningStats.polyfillsGenerated}</div>
                    <div className="text-xs text-muted-foreground">Polyfills</div>
                  </div>
                  <div className="text-center p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <div className="text-2xl font-bold text-purple-500">{edgeFunctions.length}</div>
                    <div className="text-xs text-muted-foreground">Edge Funcs</div>
                  </div>
                </div>

                {/* Suspicious patterns warning */}
                {cleaningStats.suspiciousPatterns.length > 0 && (
                  <Alert className="mt-4" variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{cleaningStats.suspiciousPatterns.length} avertissements détectés :</strong>
                      <ul className="list-disc list-inside mt-1 text-sm">
                        {cleaningStats.suspiciousPatterns.slice(0, 5).map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                        {cleaningStats.suspiciousPatterns.length > 5 && (
                          <li>... et {cleaningStats.suspiciousPatterns.length - 5} autres</li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Pack Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Configuration du Pack
                </CardTitle>
                <CardDescription>
                  Choisissez les composants à inclure dans votre Liberation Pack
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Backend option */}
                  <div className={`p-4 rounded-lg border ${includeBackend ? 'bg-card border-green-500/30' : 'bg-muted/50 border-muted'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Server className="h-5 w-5 text-green-500" />
                        <span className="font-medium">Backend API</span>
                        {edgeFunctions.length > 0 && (
                          <Badge variant="outline">{edgeFunctions.length} routes</Badge>
                        )}
                      </div>
                      <Switch 
                        checked={includeBackend} 
                        onCheckedChange={setIncludeBackend}
                        disabled={edgeFunctions.length === 0}
                      />
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Edge Functions → Express.js</li>
                      <li>• Middleware d'authentification</li>
                      <li>• Health checks intégrés</li>
                    </ul>
                  </div>
                  
                  {/* Database option */}
                  <div className={`p-4 rounded-lg border ${includeDatabase ? 'bg-card border-purple-500/30' : 'bg-muted/50 border-muted'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Database className="h-5 w-5 text-purple-500" />
                        <span className="font-medium">Base de données</span>
                      </div>
                      <Switch 
                        checked={includeDatabase} 
                        onCheckedChange={setIncludeDatabase}
                        disabled={!sqlSchema}
                      />
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Schéma SQL complet</li>
                      <li>• Politiques RLS</li>
                      <li>• Scripts de migration</li>
                    </ul>
                  </div>
                </div>

                {/* NCS V2.0 Features */}
                <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Award className="h-5 w-5 text-amber-500" />
                      NCS Version 2.0 - La Grande Messe de Libération
                    </CardTitle>
                    <CardDescription>
                      Pack de souveraineté ultime avec 10 phases de purification
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3">
                      {/* Phase 1: Manifest Signé */}
                      <div className="p-3 rounded-lg bg-background border flex flex-col items-center text-center gap-2">
                        <FileSignature className="h-6 w-6 text-green-500" />
                        <span className="text-xs font-medium">Manifest SHA-256</span>
                        <Badge variant="outline" className="text-[10px]">Phase 1</Badge>
                      </div>
                      
                      {/* Phase 2: Multi-Deploy */}
                      <div className="p-3 rounded-lg bg-background border flex flex-col items-center text-center gap-2">
                        <Cloud className="h-6 w-6 text-blue-500" />
                        <span className="text-xs font-medium">Multi-Deploy</span>
                        <Badge variant="outline" className="text-[10px]">Fly/Render/Railway</Badge>
                      </div>
                      
                      {/* Phase 3: OWASP */}
                      <div className="p-3 rounded-lg bg-background border flex flex-col items-center text-center gap-2">
                        <Shield className="h-6 w-6 text-red-500" />
                        <span className="text-xs font-medium">Audit OWASP</span>
                        <Badge variant="outline" className="text-[10px]">A01-A09</Badge>
                      </div>
                      
                      {/* Phase 4: Tests Auto */}
                      <div className="p-3 rounded-lg bg-background border flex flex-col items-center text-center gap-2">
                        <TestTube className="h-6 w-6 text-purple-500" />
                        <span className="text-xs font-medium">Tests Auto</span>
                        <Badge variant="outline" className="text-[10px]">Unit/Intég/Sécu</Badge>
                      </div>
                      
                      {/* Phase 5: Rapport 10 pages */}
                      <div className="p-3 rounded-lg bg-background border flex flex-col items-center text-center gap-2">
                        <FileText className="h-6 w-6 text-orange-500" />
                        <span className="text-xs font-medium">Rapport Complet</span>
                        <Badge variant="outline" className="text-[10px]">10 pages HTML</Badge>
                      </div>
                      
                      {/* Phase 6: Sécurité Avancée */}
                      <div className="p-3 rounded-lg bg-background border flex flex-col items-center text-center gap-2">
                        <Lock className="h-6 w-6 text-rose-500" />
                        <span className="text-xs font-medium">Audit Sécurité</span>
                        <Badge variant="outline" className="text-[10px]">Backdoors/DNS</Badge>
                      </div>
                      
                      {/* Phase 7: Diagrammes Mermaid */}
                      <div className="p-3 rounded-lg bg-background border flex flex-col items-center text-center gap-2">
                        <Network className="h-6 w-6 text-cyan-500" />
                        <span className="text-xs font-medium">Architecture</span>
                        <Badge variant="outline" className="text-[10px]">Mermaid</Badge>
                      </div>
                      
                      {/* Phase 8: Clean Architecture */}
                      <div className="p-3 rounded-lg bg-background border flex flex-col items-center text-center gap-2">
                        <Layers className="h-6 w-6 text-indigo-500" />
                        <span className="text-xs font-medium">Clean Arch</span>
                        <Badge variant="outline" className="text-[10px]">Domain/App/UI</Badge>
                      </div>
                      
                      {/* Phase 9: Coffre Secrets */}
                      <div className="p-3 rounded-lg bg-background border flex flex-col items-center text-center gap-2">
                        <Key className="h-6 w-6 text-yellow-500" />
                        <span className="text-xs font-medium">Coffre Secrets</span>
                        <Badge variant="outline" className="text-[10px]">Vault/Doppler</Badge>
                      </div>
                      
                      {/* Phase 10: Signature ZIP */}
                      <div className="p-3 rounded-lg bg-background border flex flex-col items-center text-center gap-2">
                        <Hash className="h-6 w-6 text-emerald-500" />
                        <span className="text-xs font-medium">Signature ZIP</span>
                        <Badge variant="outline" className="text-[10px]">CHECKSUM.sha256</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* What's included - Updated for V2 */}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-primary" />
                    Contenu du Pack NCS 2.0
                  </h4>
                  <div className="grid md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground text-xs">Infrastructure</p>
                      <div>• docker-compose.yml</div>
                      <div>• Dockerfile optimisé</div>
                      <div>• fly.toml / render.yaml</div>
                      <div>• railway.json / helm/</div>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground text-xs">Sécurité</p>
                      <div>• sovereignty_manifest.json</div>
                      <div>• SOVEREIGNTY_BADGE.svg</div>
                      <div>• reports/owasp_compliance.json</div>
                      <div>• CHECKSUM.sha256</div>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground text-xs">Documentation</p>
                      <div>• LIBERATION_REPORT.html</div>
                      <div>• docs/ARCHITECTURE.md</div>
                      <div>• tests/ (unit/intég/sécu)</div>
                      <div>• secrets/ (vault/doppler)</div>
                    </div>
                  </div>
                </div>

                {/* Generate button */}
                {downloadUrl ? (
                  <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-success/10 border border-success/20">
                    <CheckCircle2 className="h-12 w-12 text-success" />
                    <div className="text-center">
                      <h4 className="font-semibold text-lg">Pack prêt !</h4>
                      <p className="text-sm text-muted-foreground">
                        Score de souveraineté: {cleaningStats.sovereigntyScore}%
                      </p>
                      {/* Production Ready Status */}
                      {productionReadyInfo && (
                        <div className={`mt-2 p-2 rounded ${productionReadyInfo.isReady ? 'bg-success/20' : 'bg-yellow-500/20'}`}>
                          <p className={`text-sm font-medium ${productionReadyInfo.isReady ? 'text-success' : 'text-yellow-600'}`}>
                            {productionReadyInfo.isReady 
                              ? `✅ PRODUCTION READY (${productionReadyInfo.overallScore}%)` 
                              : `⚠️ ${productionReadyInfo.criticalBlockers?.length || 0} blocages`}
                          </p>
                          {productionReadyInfo.certifications && (
                            <div className="flex gap-2 justify-center mt-1 flex-wrap">
                              {productionReadyInfo.certifications.coolifyReady && <Badge variant="outline" className="text-xs">Coolify ✓</Badge>}
                              {productionReadyInfo.certifications.dockerReady && <Badge variant="outline" className="text-xs">Docker ✓</Badge>}
                              {productionReadyInfo.certifications.sovereigntyCompliant && <Badge variant="outline" className="text-xs">Souverain ✓</Badge>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <Button onClick={handleDownload} size="lg" className="gap-2">
                      <Download className="h-5 w-5" />
                      Télécharger le pack
                    </Button>
                    
                    {/* Export to GitHub section - Always visible */}
                    <div className="flex flex-col items-center gap-3 pt-4 border-t w-full">
                      {!config?.destinationToken ? (
                        <div className="flex flex-col items-center gap-2 text-center">
                          <p className="text-sm text-muted-foreground">
                            Configurez votre destination GitHub pour pousser le code
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              toast.info('Configurer GitHub', {
                                description: 'Allez dans Paramètres → Destinations GitHub pour configurer votre token.'
                              });
                            }}
                            className="gap-2"
                          >
                            <Github className="h-4 w-4" />
                            Configurer GitHub
                          </Button>
                        </div>
                      ) : gitHubRepoUrl ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2 text-success">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-medium">Poussé vers GitHub !</span>
                          </div>
                          <Button variant="outline" asChild>
                            <a href={gitHubRepoUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                              <Github className="h-4 w-4" />
                              Voir le dépôt
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      ) : exportingToGitHub ? (
                        <div className="w-full space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{gitHubPushMessage}</span>
                            <span className="font-medium">{gitHubPushProgress}%</span>
                          </div>
                          <Progress value={gitHubPushProgress} className="h-2" />
                          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Push vers GitHub en cours...
                          </div>
                        </div>
                      ) : (
                        <>
                          <Button 
                            onClick={handleExportToGitHub}
                            disabled={exportingToGitHub}
                            variant="outline"
                            className="gap-2"
                          >
                            <Github className="h-4 w-4" />
                            Pousser vers GitHub
                          </Button>
                          <p className="text-xs text-muted-foreground text-center">
                            Destination: {config.destinationUsername}/{config.createNewRepo 
                              ? `${projectName.toLowerCase().replace(/\s+/g, '-')}-liberated` 
                              : config.existingRepoName}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    {cleaningStats.sovereigntyScore < 50 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Score trop bas ({cleaningStats.sovereigntyScore}%). Nettoyage manuel requis avant génération.
                        </AlertDescription>
                      </Alert>
                    )}
                    <Button 
                      onClick={handleGeneratePack} 
                      disabled={isGeneratingPack || cleaningStats.sovereigntyScore < 50}
                      size="lg"
                      className="gap-2"
                    >
                      {isGeneratingPack ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Génération en cours...
                        </>
                      ) : (
                        <>
                          <Package className="h-5 w-5" />
                          Générer le Liberation Pack
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LiberationPackHub;
