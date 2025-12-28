import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import {
  Upload,
  Download,
  Github,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileCode,
  Package,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Shield,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  cleanSourceFile,
  checkProprietaryCDN,
  detectNeededPolyfills,
  generateEnvExample,
  HOOK_POLYFILLS,
  PROPRIETARY_FILES,
} from "@/lib/clientProprietaryPatterns";
import JSZip from "jszip";
import { PostLiberationOffers } from "./PostLiberationOffers";

type FlowStep = "upload" | "analyzing" | "results" | "download";

interface CleanedFile {
  path: string;
  content: string;
  cleaned: boolean;
  changes?: string[];
}

interface CleaningStats {
  filesRemoved: number;
  filesCleanedByAI: number;
  filesCleanedLocally: number;
  packagesRemoved: number;
  polyfillsGenerated: number;
  cdnUrlsReplaced: number;
}

}
      <div className="flex items-center justify-center gap-4 mb-8">
        {[
          { id: "upload", label: "Import", icon: Upload },
          { id: "analyzing", label: "Analyse", icon: FileCode },
          { id: "results", label: "Résultats", icon: CheckCircle2 },
          { id: "download", label: "Télécharger", icon: Download }
        ].map((s, idx) => {
          const isActive = step === s.id;
          const isPast = ["upload", "analyzing", "results", "download"].indexOf(step) > idx;
          
          return (
            <div key={s.id} className="flex items-center gap-2">
              {idx > 0 && <ArrowRight className={`h-4 w-4 ${isPast ? "text-primary" : "text-muted-foreground/30"}`} />}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                isActive ? "bg-primary text-primary-foreground" :
                isPast ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                <s.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{s.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {}
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
                  ou cliquez pour sélectionner un fichier
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step: Analyzing */}
      {step === "analyzing" && (
        <Card className="animate-fade-in">
          <CardContent className="py-16 text-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-6" />
            <h3 className="text-xl font-semibold mb-2">Analyse en cours...</h3>
            <p className="text-muted-foreground mb-6">{progressMessage || "Veuillez patienter"}</p>
            <Progress value={progress} className="max-w-md mx-auto" />
          </CardContent>
        </Card>
      )}

      {/* Step: Results */}
      {step === "results" && analysisResult && (
        <div className="space-y-6 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Résultats de l'analyse: {projectName}</span>
                <Badge variant={analysisResult.score >= 80 ? "default" : analysisResult.score >= 50 ? "secondary" : "destructive"}>
                  Score: {analysisResult.score}/100
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-foreground">{extractedFiles.size}</div>
                  <div className="text-sm text-muted-foreground">Fichiers</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-destructive">{analysisResult.issues.filter(i => i.severity === "critical").length}</div>
                  <div className="text-sm text-muted-foreground">Critiques</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-warning">{analysisResult.issues.filter(i => i.severity === "warning").length}</div>
                  <div className="text-sm text-muted-foreground">Avertissements</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{analysisResult.dependencies.filter(d => d.status === "incompatible").length}</div>
                  <div className="text-sm text-muted-foreground">Packages</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-destructive">{analysisResult.filesToRemove.length}</div>
                  <div className="text-sm text-muted-foreground">À supprimer</div>
                </div>
              </div>

              {analysisResult.platform && (
                <Alert>
                  <Package className="h-4 w-4" />
                  <AlertDescription>
                    Plateforme détectée: <strong>{analysisResult.platform}</strong>
                  </AlertDescription>
                </Alert>
              )}
              
              {analysisResult.filesToRemove.length > 0 && (
                <Alert variant="destructive">
                  <Trash2 className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{analysisResult.filesToRemove.length}</strong> fichier(s) propriétaire(s) seront supprimés: {analysisResult.filesToRemove.slice(0, 3).join(', ')}
                    {analysisResult.filesToRemove.length > 3 && ` et ${analysisResult.filesToRemove.length - 3} autre(s)`}
                  </AlertDescription>
                </Alert>
              )}
              
              {analysisResult.proprietaryCDNs.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{analysisResult.proprietaryCDNs.length}</strong> CDN propriétaire(s) détecté(s) - les URLs seront nettoyées
                  </AlertDescription>
                </Alert>
              )}

              {analysisResult.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Recommandations:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {analysisResult.recommendations.slice(0, 5).map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={reset}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Nouveau projet
                </Button>
                <Button onClick={handleCleanAndDownload} className="flex-1">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Nettoyer et préparer le téléchargement
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step: Download */}
      {step === "download" && (
        <div className="space-y-6 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Shield className="h-5 w-5 text-green-500" />}
                {loading ? "Nettoyage en cours..." : "Projet Libéré"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">{progressMessage}</p>
                  <Progress 
                    value={(cleaningProgress.done / Math.max(cleaningProgress.total, 1)) * 100} 
                    className="max-w-md mx-auto mt-4"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    {cleaningProgress.done}/{cleaningProgress.total} fichiers
                  </p>
                </div>
              ) : (
                <>
                  <Alert className="bg-green-500/10 border-green-500">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription>
                      Votre projet est maintenant <strong>100% libéré</strong> et prêt à être téléchargé!
                    </AlertDescription>
                  </Alert>
                  
                  {/* Cleaning Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-xl font-bold text-destructive">{cleaningStats.filesRemoved}</div>
                      <div className="text-xs text-muted-foreground">Fichiers supprimés</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-xl font-bold text-primary">{cleaningStats.filesCleanedByAI + cleaningStats.filesCleanedLocally}</div>
                      <div className="text-xs text-muted-foreground">Fichiers nettoyés</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-xl font-bold text-orange-500">{cleaningStats.packagesRemoved}</div>
                      <div className="text-xs text-muted-foreground">Packages supprimés</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-xl font-bold text-blue-500">{cleaningStats.polyfillsGenerated}</div>
                      <div className="text-xs text-muted-foreground">Polyfills générés</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-xl font-bold text-yellow-500">{analysisResult?.score || 0}</div>
                      <div className="text-xs text-muted-foreground">Score initial</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-xl font-bold text-green-500">100</div>
                      <div className="text-xs text-muted-foreground">Score final</div>
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <h4 className="font-medium">Contenu du ZIP:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>✓ Code source nettoyé ({cleanedFiles.length} fichiers)</li>
                      <li>✓ Dockerfile optimisé avec healthcheck</li>
                      <li>✓ nginx.conf configuré (gzip, cache, SPA)</li>
                      <li>✓ .env.example avec variables détectées</li>
                      <li>✓ README_INOPAY.md avec instructions complètes</li>
                      {cleaningStats.polyfillsGenerated > 0 && (
                        <li>✓ Polyfills de compatibilité (src/lib/inopay-compat/)</li>
                      )}
                    </ul>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={reset}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Nouveau projet
                    </Button>
                    <Button 
                      onClick={downloadArchive} 
                      className="flex-1"
                      disabled={isGeneratingArchive}
                    >
                      {isGeneratingArchive ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Télécharger {projectName}-libre.zip
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Deployment Guide */}
          {!loading && cleanedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Prochaines étapes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">🐳 Docker</h4>
                    <code className="text-xs bg-muted p-2 rounded block">
                      docker build -t app .<br/>
                      docker run -p 80:80 app
                    </code>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">☁️ Coolify</h4>
                    <p className="text-sm text-muted-foreground">
                      Import GitHub → Docker Build → Deploy
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">🖥️ VPS</h4>
                    <code className="text-xs bg-muted p-2 rounded block">
                      npm install && npm run build
                    </code>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Consultez le fichier README_INOPAY.md dans le ZIP pour plus de détails.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Post-Liberation Offers - shown after download */}
          {showOffers && !loading && (
            <PostLiberationOffers
              projectName={projectName}
              filesCount={cleanedFiles.length}
              onDismiss={() => setShowOffers(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
