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
  ShieldCheck,
  AlertCircle,
  Zap,
  List
} from "lucide-react";
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
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
import { toast } from "sonner";
import { analyzeZipFile, analyzeFromGitHub, RealAnalysisResult } from "@/lib/zipAnalyzer";
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
} from "@/lib/clientProprietaryPatterns";

// Configuration passée depuis le Wizard
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

type FlowStep = "upload" | "analyzing" | "cleaning" | "verifying" | "ready";

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

                {/* What's included */}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-primary" />
                    Contenu du pack
                  </h4>
                  <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>• docker-compose.yml complet</div>
                    <div>• Dockerfile optimisé</div>
                    <div>• .env.example pré-rempli</div>
                    <div>• Script quick-deploy.sh</div>
                    <div>• Guide interactif HTML</div>
                    <div>• {cleaningStats.polyfillsGenerated} polyfills générés</div>
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
                    </div>
                    <Button onClick={handleDownload} size="lg" className="gap-2">
                      <Download className="h-5 w-5" />
                      Télécharger le pack
                    </Button>
                    
                    {/* Export to GitHub section */}
                    {config?.destinationToken && (
                      <div className="flex flex-col items-center gap-3 pt-4 border-t w-full">
                        {gitHubRepoUrl ? (
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
                    )}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LiberationPackHub;
