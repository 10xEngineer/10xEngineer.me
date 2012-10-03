maintainer        "Radim Marek"
maintainer_email  "radim@10xengineer.me"
license           "Apache 2.0"
description       "10xEngineer.me base deployment"
long_description  IO.read(File.join(File.dirname(__FILE__), 'README.md'))
version           "0.1.0"

%w{ ubuntu }.each do |os|
  supports os
end

depends "mongodb"
depends "redis"
depends "java"
depends "node"
