import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const LiberationPackHub = () => {
  // Simulation des états ou props (à adapter selon ton code réel)
  const config = { sourceToken: true };
  const availableRepos = []; 

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuration du Pack Libération</CardTitle>
          <CardDescription>Gérez vos dépôts et vos déploiements.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="repos" className="w-full">
            <TabsList>
              <TabsTrigger value="repos">Dépôts</TabsTrigger>
              <TabsTrigger value="settings">Paramètres</TabsTrigger>
            </TabsList>

            <TabsContent value="repos">
              <Card className="mt-4">
                <CardContent className="pt-6">
                  {config?.sourceToken && availableRepos.length > 0 ? (
                    <div className="space-y-3">
                      <p>Dépôts disponibles trouvés.</p>
                      {/* Tes composants de liste ici */}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">Aucun dépôt disponible ou token manquant.</p>
                      <Button className="mt-4">Connecter un dépôt</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <div className="p-4">
                <p>Paramètres du hub de libération.</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiberationPackHub;
