import { TooltipProvider } from "@/components/ui/tooltip";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { authClient } from "@/lib/auth-client";
import {
  Link,
  useNavigate,
  //useParams
} from "@tanstack/react-router";
import { ThemeProvider, useTheme } from "next-themes";
// import { apiKeyPlugin } from "@/lib/auth/api-key-plugin";
// import { deleteUserPlugin } from "@/lib/auth/delete-user-plugin";
// import { magicLinkPlugin } from "@/lib/auth/magic-link-plugin";
// import { multiSessionPlugin } from "@/lib/auth/multi-session-plugin";
// import { organizationPlugin } from "@/lib/auth/organization-plugin";
// import { passkeyPlugin } from "@/lib/auth/passkey-plugin";
// import { usernamePlugin } from "@/lib/auth/username-plugin";
import { themePlugin } from "@/lib/auth/theme-plugin";
import { AuthProvider } from "./auth/auth-provider";
import { Toaster } from "./ui/sonner";

function AuthLink({ href, ...props }: React.ComponentProps<"a">) {
  return <Link to={href} {...props} />;
}

function ConvexBetterAuthComponent({
  children,
  context
}: {
  context: any; // @todo
  children: React.ReactNode;
}) {
  return (
    <ConvexBetterAuthProvider
      client={context.convexQueryClient.convexClient}
      authClient={authClient}
      initialToken={context.token}
    >
      {children}
    </ConvexBetterAuthProvider>
  );
}

function ThemeProviderComponent({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
}

function BetterAuthUIProviderComponent({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  //const { slug } = useParams({ strict: false });
  
  return (
    <AuthProvider
      authClient={authClient as any}
      redirectTo="/settings/account"
      // socialProviders={["github"]}
      emailAndPassword={{ requireEmailVerification: false }}
      navigate={navigate}
      plugins={[
        // usernamePlugin({
        //   usernamePrefix: "@",
        //   localization: { usernamePlaceholder: "username" },
        // }),
        // magicLinkPlugin(),
        // passkeyPlugin(),
        // apiKeyPlugin({ organization: true }),
        // multiSessionPlugin(),
        // deleteUserPlugin(),
        // organizationPlugin({
        //   slugPrefix: "@",
        //   slug: slug ?? null,
        // }),
        themePlugin({ useTheme }),
      ]}
      Link={AuthLink}
    >
      {children}
    </AuthProvider>
  )
}


export default function Providers({
  context,
  children,
}: {
  context: any; // @todo
  children: React.ReactNode;
}) {
  return (
    <ConvexBetterAuthComponent context={context}>
      <TooltipProvider>
        <ThemeProviderComponent
        >
          <BetterAuthUIProviderComponent
          >
            {children}

            <Toaster />
          </BetterAuthUIProviderComponent>
        </ThemeProviderComponent>
      </TooltipProvider>
    </ConvexBetterAuthComponent>
  );
}
