import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface PreviewTabProps {
  applyThemeForTesting: () => void;
}

export function PreviewTab({ applyThemeForTesting }: PreviewTabProps) {
  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted p-3 border-b">
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground">Live Preview</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={applyThemeForTesting}
                variant="outline"
                size="sm"
                className="text-foreground"
              >
                Apply Theme
              </Button>
              <Button
                type="button"
                onClick={() => window.open("/", "_blank")}
                variant="outline"
                size="sm"
                className="text-foreground"
              >
                Full Screen
              </Button>
            </div>
          </div>
        </div>
        <div className="h-[600px] w-full">
          <iframe src="/" className="w-full h-full border-0" title="Live Preview" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted p-2 border-b">
            <Label className="text-muted-foreground text-sm">Mobile View</Label>
          </div>
          <div className="h-80">
            <iframe
              src="/"
              className="w-full h-full border-0 scale-50 origin-top-left"
              style={{ width: "200%", height: "200%" }}
              title="Mobile Preview"
            />
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted p-2 border-b">
            <Label className="text-muted-foreground text-sm">Casino Page</Label>
          </div>
          <div className="h-80">
            <iframe
              src="/casino"
              className="w-full h-full border-0 scale-50 origin-top-left"
              style={{ width: "200%", height: "200%" }}
              title="Casino Preview"
            />
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted p-2 border-b">
            <Label className="text-muted-foreground text-sm">Sports Page</Label>
          </div>
          <div className="h-80">
            <iframe
              src="/sports"
              className="w-full h-full border-0 scale-50 origin-top-left"
              style={{ width: "200%", height: "200%" }}
              title="Sports Preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
