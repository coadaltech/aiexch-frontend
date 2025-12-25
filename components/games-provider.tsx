import { gameProviders } from "@/data";

export default function GamesProviderSection() {
  return (
    <section className=" py-6 ">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-primary">Games Provider</h2>
      </div>

      <div
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        className="flex gap-4 overflow-x-auto scrollbar-thin -mr-4 pr-4 scrollbar-thumb-primary/50 scrollbar-track-transparent pb-2"
      >
        {gameProviders.map((provider) => (
          <div
            key={provider.id}
            className="group bg-card border hover:border-primary
                     transition-all duration-300 cursor-pointer overflow-hidden 
                     rounded-xl 
                     w-36 h-24 flex-shrink-0 relative
                     hover:opacity-80
                    "
          >
            <div className="relative w-full h-full flex flex-col items-center justify-center p-3">
              {/* Provider Logo Placeholder */}
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-2 group-hover:scale-105 transition-transform duration-300">
                <div className="w-8 h-8 bg-primary rounded opacity-80 flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xs">
                    {provider.name.charAt(0)}
                  </span>
                </div>
              </div>

              {/* Provider Name */}
              <h3 className="font-bold text-foreground text-xs text-center leading-tight group-hover:text-primary transition-colors duration-300">
                {provider.name}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
