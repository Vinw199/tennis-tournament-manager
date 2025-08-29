// after signup, user gets redirected to this page
// Here, the user can create a space
// After creating a space, user gets redirected to the dashboard
// This is a protected route, protected from users who already have a space
// If user has a space, they are redirected to the dashboard

import { redirect } from "next/navigation"
import Image from "next/image"
import { listSpaces } from "@/lib/supabase/spaces"
import { OnboardingForm } from "@/components/onboarding/OnboardingForm"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

const OnboardingPage = async () => {
    const spaces = await listSpaces()

    if (spaces.length > 0) {
        redirect("/")
    }

    return (
        // Use a main container to center the content
        <main className="relative flex items-center justify-center min-h-screen p-4">

            {/* Background Image: 'fill' positions absolutely within the relative parent */}
            <Image 
                src="/onboarding-bg.jpg" 
                alt="A tennis court from a low angle" 
                fill 
                priority
                className="object-cover z-0" 
            />

            {/* Dark Overlay: Ensures sufficient contrast above the image */}
            <div className="absolute inset-0 bg-black/60 z-10" />

            {/* The Card: Now with more padding, a wider max-width, and softer corners */}
            <Card className="w-full max-w-md p-8 sm:p-12 z-20 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl animate-fade-in">
                
                {/* Card Header: Centered text and more space for a cleaner look */}
                <CardHeader className="text-center text-neutral-200 p-0 mb-8">
                    {/* Card Title: Larger, bolder, and more welcoming text */}
                    <CardTitle className="text-3xl sm:text-4xl font-extrabold">
                        Welcome to the Club.
                    </CardTitle>
                    {/* Card Description: Updated, encouraging text with a softer color */}
                    <CardDescription className="text-neutral-300 mt-2">
                        Every great club starts with a name.
                    </CardDescription>
                </CardHeader>
                
                <CardContent className="p-0">
                    <OnboardingForm />
                </CardContent>
            </Card>

        </main>
    )
}

export default OnboardingPage