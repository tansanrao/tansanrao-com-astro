{
  description = "Development environment for Astro Blog with NodeJS 22";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
  flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        devPkgs = with pkgs; [
          nodejs_22
        ];
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = devPkgs;
        };
      }
    );
}
